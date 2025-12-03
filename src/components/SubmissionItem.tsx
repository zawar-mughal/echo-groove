
import React, { useState, useEffect, memo } from 'react';
import { Clock } from 'lucide-react';
import { MediaSubmission } from '@/types/submission';
import { MediaThumbnail } from './MediaThumbnail';
import { BoostButton } from './BoostButton';
import { Link } from 'react-router-dom';

interface SubmissionItemProps {
  submission: MediaSubmission;
  onBoost: (id: string, userId?: string) => void;
  onPlay: (id: string) => void;
  onMediaClick?: (id: string) => void;
  isPlaying: boolean;
  currentUserId?: string;
}


const SubmissionItemComponent = ({ submission, onBoost, onPlay, onMediaClick, isPlaying, currentUserId = 'current_user' }: SubmissionItemProps) => {
  const [boostCount, setBoostCount] = useState(submission.boosts);
  const profileHref = `/profile/${encodeURIComponent(submission.submittedBy.username)}`;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const hours = Math.floor(diffInMinutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleBoost = () => {
    setBoostCount(prev => prev + 1);
    onBoost(submission.id, currentUserId);
  };


  useEffect(() => {
    setBoostCount(submission.boosts);
  }, [submission.boosts]);

  return (
    <div 
      className="submission-card flex w-full items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border bg-white border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors duration-150"
      onClick={() => onMediaClick?.(submission.id)}
    >
      {/* Media Thumbnail */}
      <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <MediaThumbnail 
          submission={submission}
          size="md"
          onClick={() => onPlay(submission.id)}
          showPlayButton={true}
          isPlaying={isPlaying}
        />
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        {/* Mobile Layout */}
        <div className="sm:hidden">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 
                  className="font-semibold text-gray-900 truncate text-base leading-tight cursor-pointer hover:text-primary transition-colors"
                  onClick={() => onMediaClick?.(submission.id)}
                >
                  {submission.title || (submission as any).trackTitle}
                </h3>
              </div>
              <p className="text-gray-600 truncate text-sm font-medium">
                {submission.creator || (submission as any).artist}
              </p>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <BoostButton
                onBoost={handleBoost}
                boostCount={boostCount}
                variant="default"
                size="md"
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Link
                to={profileHref}
                onClick={(e) => e.stopPropagation()}
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium hover:underline"
              >
                {submission.submittedBy.username}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(submission.submittedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:block">
          <div className="flex items-center gap-2 mb-1">
            <h3 
              className="font-semibold text-gray-900 truncate text-lg cursor-pointer hover:text-primary transition-colors"
              onClick={() => onMediaClick?.(submission.id)}
            >
              {submission.title || (submission as any).trackTitle}
            </h3>
          </div>
          <p className="text-gray-600 truncate mb-1 font-medium">
            {submission.creator || (submission as any).artist}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>
              by{' '}
              <Link
                to={profileHref}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline"
              >
                {submission.submittedBy.username}
              </Link>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(submission.submittedAt)}
            </span>
            {submission.userBoostData.length > 1 && (
              <span className="text-blue-600 font-mono">
                {submission.userBoostData.length} users
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Boost Button */}
      <div className="hidden sm:block flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <BoostButton
          onBoost={handleBoost}
          boostCount={boostCount}
          variant="default"
          size="md"
        />
      </div>
    </div>
  );
};

export const SubmissionItem = memo(SubmissionItemComponent, (prevProps, nextProps) => {
  // Only re-render if this submission's relevant props changed
  return (
    prevProps.submission.id === nextProps.submission.id &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.submission.boosts === nextProps.submission.boosts &&
    prevProps.submission.title === nextProps.submission.title &&
    prevProps.currentUserId === nextProps.currentUserId
  );
});
