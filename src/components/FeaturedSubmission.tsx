import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Users, TrendingUp, ExternalLink } from 'lucide-react';
import { MusicSubmission } from '@/types/submission';
import { Link } from 'react-router-dom';

interface FeaturedSubmissionProps {
  submission: MusicSubmission;
  roomId: string;
  roomTitle: string;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
}

export function FeaturedSubmission({ 
  submission, 
  roomId, 
  roomTitle, 
  isPlaying = false, 
  onTogglePlay 
}: FeaturedSubmissionProps) {
  const [imageError, setImageError] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fallbackImage = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop";

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <div className="relative">
        {/* Cover Art */}
        <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20">
          <img 
            src={imageError ? fallbackImage : (submission.coverArt || fallbackImage)}
            alt={submission.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button
              onClick={onTogglePlay}
              size="lg"
              className="rounded-full w-16 h-16 bg-white/90 hover:bg-white text-black hover:text-black"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </Button>
          </div>

          {/* Trending Badge */}
          {submission.isRising && (
            <div className="absolute top-3 left-3">
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            </div>
          )}

          {/* Room Badge */}
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-black/60 text-white">
              {roomTitle}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Track Info */}
          <div className="mb-3">
            <h3 className="font-semibold text-lg leading-tight mb-1 line-clamp-1">
              {submission.title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-1">
              by {submission.creator}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span className="font-medium text-foreground">{submission.boosts.toLocaleString()}</span>
                <span>boosts</span>
              </div>
              <div className="flex items-center gap-1">
                <Play className="w-3 h-3" />
                <span>{submission.playCount}</span>
              </div>
            </div>
            {submission.duration && (
              <span>{formatDuration(submission.duration)}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link to={`/room/${roomId}`}>
                <Users className="w-4 h-4 mr-2" />
                Enter Room
              </Link>
            </Button>
            {submission.externalLink && (
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={submission.externalLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}