import { useQuery } from '@tanstack/react-query';
import { withAudiusSdk } from '@/lib/audius';

/**
 * Get streaming URL for an Audius track
 */
export const useAudiusStream = (trackId: string | undefined) => {
  return useQuery({
    queryKey: ['audius-stream', trackId],
    queryFn: async () => {
      if (!trackId) throw new Error('Track ID is required');

      try {
        const streamUrl = await withAudiusSdk((sdk) =>
          sdk.tracks.getTrackStreamUrl({ trackId })
        );

        return streamUrl;
      } catch (error) {
        console.error('Error fetching Audius stream URL:', error);
        throw error;
      }
    },
    enabled: !!trackId,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    cacheTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    retry: false,
    refetchOnWindowFocus: false,
  });
};

/**
 * Get streaming URLs for multiple tracks at once
 */
export const useAudiusStreams = (trackIds: string[] | undefined) => {
  return useQuery({
    queryKey: ['audius-streams-bulk', trackIds],
    queryFn: async () => {
      if (!trackIds || trackIds.length === 0) return [];

      const streamPromises = trackIds.map(async (trackId) => {
        try {
          const streamUrl = await withAudiusSdk((sdk) =>
            sdk.tracks.getTrackStreamUrl({ trackId })
          );
          return { trackId, streamUrl };
        } catch (error) {
          console.error(`Error fetching stream for track ${trackId}:`, error);
          return { trackId, streamUrl: null };
        }
      });

      return await Promise.all(streamPromises);
    },
    enabled: !!trackIds && trackIds.length > 0,
    staleTime: 1000 * 60 * 30,
    retry: false,
    refetchOnWindowFocus: false,
  });
};
