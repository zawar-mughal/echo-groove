import React, { memo } from 'react';
import { Play, Pause } from 'lucide-react';
import { MediaSubmission } from '@/types/submission';
import { cn } from '@/lib/utils';
import { getPublicAssetUrl } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';

interface PlaylistTrackItemProps {
  submission: MediaSubmission;
  trackNumber: number;
  onPlay: (id: string) => void;
  onSongClick: (submission: MediaSubmission) => void;
  currentlyPlaying: string | null;
  isPlaying: boolean;
}

const PlaylistTrackItemComponent = ({
  submission,
  trackNumber,
  onPlay,
  onSongClick,
  currentlyPlaying,
  isPlaying
}: PlaylistTrackItemProps) => {
  const isCurrentlyPlaying = currentlyPlaying === submission.id && isPlaying;
  const isCurrentTrack = currentlyPlaying === submission.id;
  const artwork =
    submission.thumbnail ||
    submission.coverArt ||
    (submission.thumbnailPath ? getPublicAssetUrl(submission.thumbnailPath) : undefined) ||
    '/placeholder.svg';

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all duration-200 cursor-pointer animate-fade-in"
      onClick={() => onSongClick(submission)}
    >
      {/* Album Art with Play Overlay */}
      <div className="relative flex-shrink-0">
        <div className="relative w-12 h-12 sm:w-14 sm:h-14">
          <img
            src={artwork}
            alt={`${submission.title} artwork`}
            className="w-full h-full rounded object-cover"
          />
          
          {/* Play/Pause Overlay */}
          <div 
            className={cn(
              'absolute inset-0 bg-black/40 rounded flex items-center justify-center transition-opacity cursor-pointer',
              isCurrentTrack ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onPlay(submission.id);
            }}
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white" />
            )}
          </div>

          {/* Now Playing Indicator */}
          {isCurrentTrack && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
              <div className={`w-2 h-2 bg-white rounded-full ${isCurrentlyPlaying ? 'animate-pulse' : ''}`} />
            </div>
          )}
        </div>
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground truncate hover:text-primary transition-colors">
            {submission.title}
          </h3>
          {submission.isRising && (
            <Badge variant="secondary" className="hidden text-xs sm:inline-flex bg-rose-100 text-rose-700 border-rose-200">
              Trending
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {submission.creator}
        </p>
      </div>

      {/* Duration and Track Number */}
      <div className="flex items-center gap-3 flex-shrink-0 text-sm text-muted-foreground">
        <span className="font-mono">
          {submission.duration ? formatDuration(submission.duration) : '--:--'}
        </span>
        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
          #{trackNumber}
        </span>
      </div>
    </div>
  );
};

export const PlaylistTrackItem = memo(PlaylistTrackItemComponent, (prevProps, nextProps) => {
  // Calculate playing states for this track
  const wasPlaying = prevProps.currentlyPlaying === prevProps.submission.id && prevProps.isPlaying;
  const isNowPlaying = nextProps.currentlyPlaying === nextProps.submission.id && nextProps.isPlaying;
  const wasCurrentTrack = prevProps.currentlyPlaying === prevProps.submission.id;
  const isNowCurrentTrack = nextProps.currentlyPlaying === nextProps.submission.id;

  // Only re-render if something relevant to THIS track changed
  return (
    prevProps.submission.id === nextProps.submission.id &&
    prevProps.trackNumber === nextProps.trackNumber &&
    wasPlaying === isNowPlaying &&
    wasCurrentTrack === isNowCurrentTrack &&
    prevProps.submission.title === nextProps.submission.title &&
    prevProps.submission.creator === nextProps.submission.creator &&
    prevProps.submission.isRising === nextProps.submission.isRising &&
    prevProps.submission.duration === nextProps.submission.duration &&
    prevProps.submission.thumbnail === nextProps.submission.thumbnail &&
    prevProps.submission.coverArt === nextProps.submission.coverArt &&
    prevProps.submission.thumbnailPath === nextProps.submission.thumbnailPath
  );
});
PlaylistTrackItem.displayName = 'PlaylistTrackItem';
