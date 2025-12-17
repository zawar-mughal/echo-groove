import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AudiusTrackUploadResponse } from '@/types/audius';
import { getDiscordProxiedUrl } from '@/utils/discord-proxy';

interface UploadTrackParams {
  userId: string; // Audius user ID
  audioFile: File;
  coverArtFile?: File;
  title: string;
  genre: string;
  description?: string;
  mood?: string;
  tags?: string;
  onProgress?: (progress: number) => void;
}

// Upload service URL defaults to the Fly.io deployment; override via env for local/testing
const UPLOAD_SERVICE_URL = import.meta.env.VITE_UPLOAD_SERVICE_URL ?? 'https://echo-upload-service.fly.dev';

export const useAudiusUpload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UploadTrackParams): Promise<AudiusTrackUploadResponse> => {
      const {
        userId,
        audioFile,
        coverArtFile,
        title,
        genre,
        description,
        mood,
        tags,
        onProgress,
      } = params;

      // console.log('📤 Uploading to Audius via upload service:', { userId, title, genre, uploadUrl: UPLOAD_SERVICE_URL });

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('audioFile', audioFile);
      if (coverArtFile) {
        formData.append('coverArtFile', coverArtFile);
      }
      formData.append('userId', userId);
      formData.append('title', title);
      formData.append('genre', genre);
      if (description) formData.append('description', description);
      if (mood) formData.append('mood', mood);
      if (tags) formData.append('tags', tags);

      // Call upload service (proxy URL if in Discord)
      const uploadUrl = getDiscordProxiedUrl(`${UPLOAD_SERVICE_URL}/upload`) || `${UPLOAD_SERVICE_URL}/upload`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        console.error('❌ Upload failed:', errorData);
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.success) {
        throw new Error(data?.error || 'Upload failed');
      }

      console.log('✅ Upload successful:', data.trackId, `(${data.uploadTime})`);

      // Simulate progress for better UX
      if (onProgress) {
        onProgress(100);
      }

      return {
        trackId: data.trackId,
        blockHash: null, // Not available from upload service
        blockNumber: null, // Not available from upload service
      };
    },
    onSuccess: (data, variables) => {
      // Invalidate user tracks cache to show the newly uploaded track
      queryClient.invalidateQueries({ queryKey: ['audius-user-tracks', variables.userId] });
      console.log('Track uploaded successfully to Audius:', data.trackId);
    },
    onError: (error) => {
      console.error('Failed to upload track to Audius:', error);
    },
  });
};

// TODO: These hooks also need to be migrated to Edge Functions
// They require API secret just like uploadTrack
// For now, they are disabled to prevent errors

// export const useUpdateAudiusTrack = () => {
//   // Needs Edge Function implementation
// };

// export const useDeleteAudiusTrack = () => {
//   // Needs Edge Function implementation
// };
