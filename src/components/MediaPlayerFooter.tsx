import React from 'react';
import { MediaSubmission } from '@/types/submission';
import { BoostButton } from './BoostButton';
import { Link } from 'react-router-dom';

interface MediaPlayerFooterProps {
  submission: MediaSubmission;
  onBoost: () => void;
}

export const MediaPlayerFooter = ({ submission, onBoost }: MediaPlayerFooterProps) => {
  const profileHref = `/profile/${encodeURIComponent(submission.submittedBy.username)}`;
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-between p-4 border-t bg-background/95 backdrop-blur">
      <div className="flex flex-col text-sm text-muted-foreground">
        <span>
          Submitted by{' '}
          <Link to={profileHref} className="hover:underline">
            {submission.submittedBy.username}
          </Link>
        </span>
        {submission.duration && (
          <span>{formatDuration(submission.duration)} • {submission.mediaType}</span>
        )}
      </div>
      
      <BoostButton
        onBoost={onBoost}
        boostCount={submission.boosts}
        variant="default"
        size="lg"
      />
    </div>
  );
};
