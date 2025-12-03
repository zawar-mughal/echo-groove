import React from 'react';
import { MediaSubmission } from '@/types/submission';
import { useMediaNavigation } from '@/hooks/useMediaNavigation';
import { MediaPlayerDialog } from './MediaPlayerDialog';

interface MediaPlayerProps {
  submission: MediaSubmission | null;
  submissions: MediaSubmission[];
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onBoost: (id: string, userId?: string) => void;
  currentUserId?: string;
}

export const MediaPlayer = ({ 
  submission, 
  submissions, 
  isOpen, 
  onClose, 
  isPlaying, 
  onPlayToggle, 
  onBoost,
  currentUserId = 'current_user'
}: MediaPlayerProps) => {
  const {
    currentSubmission,
    goToNext,
    goToPrevious,
    hasNext,
    hasPrevious
  } = useMediaNavigation({
    submissions,
    initialSubmissionId: submission?.id,
    onSubmissionChange: (newSubmission) => {
      // Auto-play audio when navigating - call the parent's play handler
      if (!isPlaying) {
        onPlayToggle();
      }
    }
  });

  const activeSubmission = currentSubmission || submission;

  const handleBoost = () => {
    if (activeSubmission) {
      onBoost(activeSubmission.id, currentUserId);
    }
  };

  if (!activeSubmission) return null;

  const handleTrackEnd = () => {
    if (hasNext) {
      goToNext();
    }
  };

  return (
    <MediaPlayerDialog
      submission={activeSubmission}
      submissions={submissions}
      isOpen={isOpen}
      onClose={onClose}
      isPlaying={isPlaying}
      onPlayPause={onPlayToggle}
      onTrackEnd={handleTrackEnd}
      onBoost={handleBoost}
      onPrevious={goToPrevious}
      onNext={goToNext}
      hasPrevious={hasPrevious}
      hasNext={hasNext}
    />
  );
};