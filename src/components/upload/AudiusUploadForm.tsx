import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Music, Image, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAudiusUpload } from '@/hooks/api/useAudiusUpload';
import { useAudiusAuthContext } from '@/contexts/AudiusAuthContext';
import { validateTrackFile, validateArtworkFile } from '@/lib/audiusHelpers';
import type { AudiusTrack } from '@/types/audius';

interface AudiusUploadFormProps {
  onSuccess: (trackId: string, track?: AudiusTrack) => void;
  onCancel: () => void;
  roomGenre?: string | null;
  roomTags?: string[] | null;
}

export const AudiusUploadForm = ({ onSuccess, onCancel, roomGenre, roomTags }: AudiusUploadFormProps) => {
  const { audiusUser, linkAudiusAccount } = useAudiusAuthContext();
  const uploadMutation = useAudiusUpload();

  const audioInputRef = useRef<HTMLInputElement>(null);
  const artworkInputRef = useRef<HTMLInputElement>(null);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<{ audio?: string; artwork?: string }>({});

  const [formData, setFormData] = useState({
    title: '',
  });

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateTrackFile(file);
    if (!validation.valid) {
      setErrors({ ...errors, audio: validation.error });
      setAudioFile(null);
      return;
    }

    setErrors({ ...errors, audio: undefined });
    setAudioFile(file);

    // Auto-populate title from filename
    if (!formData.title) {
      const titleFromFile = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setFormData({ ...formData, title: titleFromFile });
    }
  };

  const handleArtworkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateArtworkFile(file);
    if (!validation.valid) {
      setErrors({ ...errors, artwork: validation.error });
      setArtworkFile(null);
      return;
    }

    setErrors({ ...errors, artwork: undefined });
    setArtworkFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!audioFile) {
      setErrors({ ...errors, audio: 'Audio file is required' });
      return;
    }

    if (!audiusUser?.userId) {
      setErrors({ ...errors, audio: 'Audius account not connected' });
      return;
    }

    if (!formData.title.trim()) {
      return;
    }

    try {
      setUploadProgress(0);

      const result = await uploadMutation.mutateAsync({
        userId: audiusUser.userId,
        audioFile,
        coverArtFile: artworkFile || undefined,
        title: formData.title,
        genre: roomGenre || 'Electronic', // Use room genre or default to Electronic
        description: undefined,
        mood: undefined,
        tags: roomTags?.join(', ') || undefined, // Convert array to comma-separated string
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      onSuccess(result.trackId);
    } catch (error: any) {
      console.error('Upload failed:', error);
      setErrors({ ...errors, audio: error.message || 'Upload failed' });
    }
  };

  const isUploading = uploadMutation.isPending;
  const uploadComplete = uploadMutation.isSuccess;

  if (uploadComplete) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-500" />
        <h3 className="text-xl font-semibold">Upload Complete!</h3>
        <p className="text-sm text-muted-foreground text-center">
          Your track has been uploaded to Audius successfully.
        </p>
        <Button onClick={() => onSuccess(uploadMutation.data!.trackId)}>
          Continue
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Audio File Upload */}
        <div className="space-y-2">
          <Label htmlFor="audio-file" className="flex items-center gap-2">
            <Music className="w-4 h-4" />
            Audio File *
          </Label>
          <div className="flex gap-2">
            <Input
              ref={audioInputRef}
              id="audio-file"
              type="file"
              accept="audio/mpeg,audio/mp3"
              onChange={handleAudioFileChange}
              disabled={isUploading}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => audioInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {audioFile ? audioFile.name : 'Choose MP3 file'}
            </Button>
          </div>
          {errors.audio && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.audio}</AlertDescription>
            </Alert>
          )}
          <p className="text-xs text-muted-foreground">
            MP3 format, max 100MB
          </p>
        </div>

        {/* Cover Art Upload */}
        <div className="space-y-2">
          <Label htmlFor="artwork-file" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Cover Art (Optional)
          </Label>
          <div className="flex gap-2">
            <Input
              ref={artworkInputRef}
              id="artwork-file"
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleArtworkFileChange}
              disabled={isUploading}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => artworkInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {artworkFile ? artworkFile.name : 'Choose image file'}
            </Button>
          </div>
          {errors.artwork && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.artwork}</AlertDescription>
            </Alert>
          )}
          <p className="text-xs text-muted-foreground">
            JPG or PNG, max 10MB
          </p>
        </div>

        {/* Track Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Track Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="My Awesome Track"
            required
            disabled={isUploading}
          />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading to Audius...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isUploading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!audioFile || !formData.title.trim() || isUploading}
          className="flex-1 bg-gradient-to-r from-echo-primary to-echo-secondary"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload to Audius
            </>
          )}
        </Button>
      </div>
      {!audiusUser?.userId && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Your Audius account is not connected.
          </p>
          <Button
            type="button"
            variant="link"
            onClick={linkAudiusAccount}
            className="text-primary"
          >
            Connect to Audius
          </Button>
        </div>
      )}
    </form>
  );
};
