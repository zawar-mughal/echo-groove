import React, { useState } from 'react';
import { Music } from 'lucide-react';
import { SubmissionItem } from '@/components/SubmissionItem';
import { TrendingSubmission } from '@/components/TrendingSubmission';
import { MediaSubmission } from '@/types/submission';
import { MediaPlayer } from '@/components/MediaPlayer';

interface SubmissionsListProps {
  regularSubmissions: MediaSubmission[];
  trendingSubmission: MediaSubmission | null;
  onBoost: (id: string, userId?: string) => void;
  onPlay: (id: string) => void;
  onRowClick: (id: string) => void;
  onMediaClick?: (id: string) => void;
  currentlyPlaying: string | null;
  isPlaying: boolean;
  currentUserId: string;
}

export const SubmissionsList = ({
  regularSubmissions,
  trendingSubmission,
  onBoost,
  onPlay,
  onRowClick,
  onMediaClick,
  currentlyPlaying,
  isPlaying,
  currentUserId
}: SubmissionsListProps) => {
  if (regularSubmissions.length === 0 && !trendingSubmission) {
    return (
      <div className="text-center py-12 animate-fade-in-scale">
        <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4 hover:text-primary transition-colors duration-500" />
        <h3 className="text-lg font-semibold text-foreground mb-2 text-gradient">
          No tracks submitted yet
        </h3>
        <p className="text-muted-foreground">
          Be the first to submit a track and start the season!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 mx-4 sm:mx-0">
      {/* Regular Submissions - Scrollable Area */}
      <div className="flex-1 overflow-y-auto max-h-96 mb-4 space-y-2 sm:space-y-3 floating-scrollbar">
        {regularSubmissions.map((submission, index) => (
          <SubmissionItem
            key={submission.id}
            submission={submission}
            onBoost={onBoost}
            onPlay={onPlay}
            onMediaClick={onMediaClick || onRowClick}
            isPlaying={currentlyPlaying === submission.id && isPlaying}
            currentUserId={currentUserId}
          />
        ))}
      </div>

      {/* Trending Submission - Pinned to Bottom */}
      {trendingSubmission && (
        <div className="mb-4">
          <TrendingSubmission
            submission={trendingSubmission}
            onBoost={onBoost}
            onPlay={onPlay}
            onMediaClick={onMediaClick || onRowClick}
            isPlaying={currentlyPlaying === trendingSubmission.id && isPlaying}
            currentUserId={currentUserId}
          />
        </div>
      )}

    </div>
  );
};
