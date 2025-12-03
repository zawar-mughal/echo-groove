import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MediaSubmission } from '@/types/submission';
import { MediaPlayerHeader } from './MediaPlayerHeader';
import { MediaPlayerContent } from './MediaPlayerContent';
import { MediaPlayerFooter } from './MediaPlayerFooter';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

interface MediaPlayerDialogProps {
  submission: MediaSubmission;
  submissions: MediaSubmission[];
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onTrackEnd: () => void;
  onBoost: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export const MediaPlayerDialog = ({
  submission,
  submissions,
  isOpen,
  onClose,
  isPlaying,
  onPlayPause,
  onTrackEnd,
  onBoost,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext
 }: MediaPlayerDialogProps) => {
  const isMobile = useIsMobile();
  
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeNavigation({
    // Use vertical swipes on mobile (TikTok-style), horizontal on desktop
    onSwipeUp: isMobile && hasNext ? onNext : undefined,
    onSwipeDown: isMobile && hasPrevious ? onPrevious : undefined,
    onSwipeLeft: !isMobile && hasNext ? onNext : undefined,
    onSwipeRight: !isMobile && hasPrevious ? onPrevious : undefined
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl w-[100vw] h-[100vh] sm:w-[95vw] sm:h-[90vh] overflow-hidden p-0 flex flex-col sm:rounded-lg"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{submission.title}</DialogTitle>
          <DialogDescription>Media player for {submission.mediaType} content</DialogDescription>
        </DialogHeader>
        
        <MediaPlayerHeader
          submission={submission}
          submissions={submissions}
          onPrevious={onPrevious}
          onNext={onNext}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
        />
        
        <MediaPlayerContent
          submission={submission}
          isPlaying={isPlaying}
          onPlayPause={onPlayPause}
          onTrackEnd={onTrackEnd}
        />

        <MediaPlayerFooter
          submission={submission}
          onBoost={onBoost}
        />
      </DialogContent>
    </Dialog>
  );
};