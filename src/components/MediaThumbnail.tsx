import React from 'react';
import { Play, Pause, Music, Image as ImageIcon, Video } from 'lucide-react';
import { MediaSubmission } from '@/types/submission';
import { cn } from '@/lib/utils';

interface MediaThumbnailProps {
  submission: MediaSubmission;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showPlayButton?: boolean;
  isPlaying?: boolean;
}

const MediaThumbnailComponent = ({
  submission,
  size = 'md',
  onClick,
  showPlayButton = true,
  isPlaying = false
}: MediaThumbnailProps) => {
  const [imageError, setImageError] = React.useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-20 h-20'
  };

  const getMediaIcon = () => {
    return <Music className="w-7 h-7 text-gray-400" />;
  };

  const thumbnailUrl = submission.thumbnail || submission.coverArt;
  const showImage = thumbnailUrl && !imageError;

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shadow-sm cursor-pointer group transition-all duration-200",
        sizeClasses[size],
        'aspect-square',
        onClick && "hover:scale-105 hover:shadow-md",
        isPlaying && "ring-2 ring-primary ring-offset-2 transition-shadow"
      )}
      onClick={onClick}
    >
      {/* Background Image/Thumbnail */}
      {showImage ? (
        <img
          src={thumbnailUrl}
          alt={submission.title}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        getMediaIcon()
      )}


      {/* Play Button Overlay */}
      {showPlayButton && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            "bg-black/70 rounded-full p-2 transition-all duration-200",
            "group-hover:bg-black/90 group-hover:scale-110"
          )}>
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white ml-0.5" />
            )}
          </div>
        </div>
      )}

      {/* Duration Badge for Audio */}
      {submission.duration && (
        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
          {Math.floor(submission.duration / 60)}:{(submission.duration % 60).toString().padStart(2, '0')}
        </div>
      )}
    </div>
  );
};

// Memoize component to prevent re-renders when props haven't changed
export const MediaThumbnail = React.memo(MediaThumbnailComponent, (prevProps, nextProps) => {
  // Only re-render if isPlaying changed for this specific submission
  return prevProps.isPlaying === nextProps.isPlaying &&
         prevProps.submission.id === nextProps.submission.id &&
         prevProps.size === nextProps.size &&
         prevProps.showPlayButton === nextProps.showPlayButton;
});
