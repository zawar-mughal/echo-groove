import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';
import type { SelectableAudiusTrack } from '@/types/audius';
import { formatDuration, formatPlayCount, getThumbnailArtwork } from '@/lib/audiusHelpers';

interface AudiusTrackCardProps {
  track: SelectableAudiusTrack;
  onSelect?: (track: SelectableAudiusTrack) => void;
  isSelected?: boolean;
  showSelectButton?: boolean;
}

export const AudiusTrackCard = ({
  track,
  onSelect,
  isSelected = false,
  showSelectButton = true,
}: AudiusTrackCardProps) => {
  const artworkUrl = getThumbnailArtwork(track.artwork);
  const isDisabled = track.isAlreadySubmitted || !track.canSubmit;

  return (
    <Card
      className={`
        relative overflow-hidden transition-all duration-200
        ${isDisabled ? 'opacity-60' : 'hover:shadow-lg cursor-pointer'}
        ${isSelected ? 'ring-2 ring-echo-primary' : ''}
      `}
    >
      <div className="flex gap-3 p-3">
        {/* Album Artwork */}
        <div className="relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden bg-muted">
          {artworkUrl ? (
            <img
              src={artworkUrl}
              alt={track.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-8 h-8 text-muted-foreground" />
            </div>
          )}

          {track.isAlreadySubmitted && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm truncate" title={track.title}>
              {track.title}
            </h3>
            <p className="text-xs text-muted-foreground truncate" title={track.user.name}>
              {track.user.name}
              {track.user.isVerified && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  ✓
                </Badge>
              )}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(track.duration)}
            </span>
            <span className="flex items-center gap-1">
              <Play className="w-3 h-3" />
              {formatPlayCount(track.playCount)}
            </span>
            {track.favoriteCount > 0 && (
              <span className="flex items-center gap-1">
                ❤️ {formatPlayCount(track.favoriteCount)}
              </span>
            )}
          </div>

          {/* Genre Badge */}
          {track.genre && (
            <Badge variant="outline" className="w-fit text-[10px] mt-1">
              {track.genre}
            </Badge>
          )}
        </div>

        {/* Select Button */}
        {showSelectButton && (
          <div className="flex-shrink-0 flex items-center">
            {track.isAlreadySubmitted ? (
              <Badge variant="secondary" className="h-fit">
                Already Submitted
              </Badge>
            ) : (
              <Button
                size="sm"
                onClick={() => onSelect?.(track)}
                disabled={isDisabled}
                className={isSelected ? 'bg-echo-primary' : ''}
              >
                {isSelected ? 'Selected' : 'Select'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Trending indicator */}
      {track.favoriteCount > 1000 && (
        <div className="absolute top-2 right-2">
          <Badge variant="default" className="bg-gradient-to-r from-echo-primary to-echo-secondary text-white text-[10px]">
            <TrendingUp className="w-3 h-3 mr-1" />
            Trending
          </Badge>
        </div>
      )}
    </Card>
  );
};

// Simplified version for compact display
export const AudiusTrackCardCompact = ({
  track,
  onSelect,
  isSelected = false,
}: Pick<AudiusTrackCardProps, 'track' | 'onSelect' | 'isSelected'>) => {
  const artworkUrl = getThumbnailArtwork(track.artwork);
  const isDisabled = track.isAlreadySubmitted;

  return (
    <div
      className={`
        flex items-center gap-2 p-2 rounded-lg transition-colors
        ${isDisabled ? 'opacity-50' : 'hover:bg-accent cursor-pointer'}
        ${isSelected ? 'bg-accent' : ''}
      `}
      onClick={() => !isDisabled && onSelect?.(track)}
    >
      {/* Mini artwork */}
      <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
        {artworkUrl ? (
          <img src={artworkUrl} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{track.title}</p>
        <p className="text-xs text-muted-foreground truncate">{track.user.name}</p>
      </div>

      {/* Status */}
      {isDisabled && (
        <CheckCircle2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      )}
    </div>
  );
};
