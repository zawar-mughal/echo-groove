import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaSubmission } from '@/types/submission';

interface MediaPlayerHeaderProps {
  submission: MediaSubmission;
  submissions: MediaSubmission[];
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export const MediaPlayerHeader = ({
  submission,
  submissions,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext
}: MediaPlayerHeaderProps) => {
  const currentIndex = submissions.findIndex(s => s.id === submission.id);
  
  return (
    <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevious}
        disabled={!hasPrevious}
        className="text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-semibold">{submission.title}</h2>
        <p className="text-xs text-muted-foreground">by {submission.creator}</p>
        <div className="text-xs text-muted-foreground mt-1">
          {currentIndex + 1} / {submissions.length}
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={!hasNext}
        className="text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
};