import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Music, Image, Lock, ArrowLeft } from 'lucide-react';
import { MediaSubmission } from '@/types/submission';
import { useAuth } from '@/contexts/AuthContext';
import { useAudiusAuthContext } from '@/contexts/AudiusAuthContext';
import { EchoLoginModal } from '@/components/auth/EchoLoginModal';
import { ExistingSubmissionSearch } from '@/components/upload/ExistingSubmissionSearch';
import { AudiusUploadForm } from '@/components/upload/AudiusUploadForm';
import { useAudiusTrack } from '@/hooks/api/useUserAudiusTracks';
import { useRoom } from '@/hooks/api/useRooms';
import type { AudiusTrack } from '@/types/audius';

interface SubmissionFormProps {
  onSubmit: (submission: Omit<MediaSubmission, 'id' | 'boosts' | 'actualBoosts' | 'userBoostData' | 'boostEvents' | 'boostVelocity' | 'velocityTrend' | 'isRising' | 'risingType' | 'submittedAt' | 'playCount' | 'usersBoosted' | 'isVisible'>) => void;
  roomId?: string;
  seasonId?: string;
}

export const SubmissionForm = ({ onSubmit, roomId, seasonId }: SubmissionFormProps) => {
  const { isAuthenticated, user, profile } = useAuth();
  const { isAudiusLinked, linkAudiusAccount, audiusUser } = useAudiusAuthContext();
  const [title, setTitle] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedExisting, setSelectedExisting] = useState<any>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [uploadedTrackId, setUploadedTrackId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittedTrackIdRef = useRef<string | null>(null);

  // Fetch room data for genre/tags
  const { data: room } = useRoom(roomId);

  // Fetch track data if we have an uploaded track ID
  const { data: uploadedTrack } = useAudiusTrack(uploadedTrackId || '');

  // Auto-submit when uploaded track data is available
  useEffect(() => {
    if (uploadedTrack && !isSubmitting && uploadedTrack.id !== submittedTrackIdRef.current) {
      submittedTrackIdRef.current = uploadedTrack.id;
      handleSubmitTrack(uploadedTrack);
    }
  }, [uploadedTrack, isSubmitting]);

  const handleCreateNew = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (!isAudiusLinked) {
      linkAudiusAccount();
      return;
    }
    setIsCreatingNew(true);
    setSelectedExisting(null);
  };

  const handleBackToSearch = () => {
    setIsCreatingNew(false);
    setUploadedTrackId(null);
  };

  const handleUploadSuccess = (trackId: string, track?: AudiusTrack) => {
    setUploadedTrackId(trackId);
    // If track data is provided, we can submit immediately
    if (track) {
      handleSubmitTrack(track);
    }
  };

  const handleSubmitTrack = (track: AudiusTrack) => {
    setIsSubmitting(true);
    try {
      const submissionData = {
        title: track.title,
        creator: track.user.name,
        mediaType: 'audio' as const,
        provider: 'audius' as const,
        provider_track_id: track.id,
        externalLink: track.permalink,
        coverArt: track.artwork?._480x480 || track.artwork?._1000x1000 || '',
        thumbnail: track.artwork?._150x150 || '',
        submittedBy: {
          id: user?.id || audiusUser?.userId || '',
          username: profile?.username || audiusUser?.handle || 'Anonymous',
          avatar: profile?.avatar_url || audiusUser?.profilePicture?._150x150 || ''
        },
        duration: track.duration,
      };

      console.log('[SubmissionForm] Submitting track with artwork:', {
        trackId: track.id,
        title: track.title,
        artworkObject: track.artwork,
        coverArt: submissionData.coverArt,
        thumbnail: submissionData.thumbnail
      });

      onSubmit(submissionData);
    } catch (error) {
      console.error('Failed to submit track:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitExisting = () => {
    if (!selectedExisting) return;

    setIsSubmitting(true);
    try {
      const submissionData = {
        title: selectedExisting.title,
        creator: selectedExisting.creator,
        mediaType: 'audio' as const,
        provider: 'audius' as const,
        provider_track_id: selectedExisting.id,
        externalLink: selectedExisting.url,
        coverArt: selectedExisting.thumbnail || '',
        thumbnail: selectedExisting.thumbnail || '',
        submittedBy: {
          id: user?.id || '',
          username: profile?.username || 'Anonymous',
          avatar: profile?.avatar_url || ''
        },
        duration: selectedExisting.duration || 0,
      };

      onSubmit(submissionData);
    } catch (error) {
      console.error('Failed to submit track:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Show upload form when creating new */}
        {isCreatingNew ? (
          <>
            <Button
              variant="ghost"
              onClick={handleBackToSearch}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Button>
            <AudiusUploadForm
              onSuccess={handleUploadSuccess}
              onCancel={handleBackToSearch}
              roomGenre={room?.genre}
              roomTags={room?.tags}
            />
          </>
        ) : (
          <>
            {/* Title Input with Search */}
            <div className="space-y-3">
              <Label htmlFor="title" className="text-base font-medium flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                Track Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Search for a track..."
                className="h-12 text-base rounded-xl border-2 focus:border-primary/50 bg-background/50"
              />
              {title.length >= 2 && (
                <ExistingSubmissionSearch
                  onSelectExisting={setSelectedExisting}
                  onClearSelection={() => setSelectedExisting(null)}
                  selectedSubmission={selectedExisting}
                  searchQuery={title}
                  onCreateNew={handleCreateNew}
                />
              )}
            </div>

            {/* Submit button for existing track */}
            {selectedExisting && (
              <Button
                onClick={handleSubmitExisting}
                disabled={isSubmitting || !isAuthenticated}
                className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Track to Room'}
              </Button>
            )}
          </>
        )}
      </div>

      <EchoLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Join Echo to Upload"
        subtitle="Sign in to upload your tracks directly to the Echo network"
      />
    </>
  );
};
