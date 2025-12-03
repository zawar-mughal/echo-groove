import React from 'react';
import { TrendingRoom } from '@/utils/roomDiscovery';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Music, 
  ChevronRight,
  Flame
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TrendingRoomCardProps {
  room: TrendingRoom;
  onPlayTrack: (trackId: string) => void;
  currentlyPlaying?: string;
}

export const TrendingRoomCard: React.FC<TrendingRoomCardProps> = ({
  room,
  onPlayTrack,
  currentlyPlaying,
}) => {
  const spotlightTrack = room.spotlightSubmission;
  const isSpotlightPlaying = currentlyPlaying === spotlightTrack?.id;

  const handlePlayPause = () => {
    if (spotlightTrack) {
      onPlayTrack(spotlightTrack.id);
    }
  };

  return (
    <Card className="group hover-lift hover-glow bg-gradient-to-br from-card to-card/80 border border-echo-neutral-300">
      <CardContent className="p-6">
        {/* Room info with trending indicator */}
        <div className="mb-4 relative">
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full p-1.5 shadow-lg animate-pulse">
            <Flame className="w-3 h-3 text-white" />
          </div>
          <h3 className="font-bold text-lg text-foreground line-clamp-1 mb-2">
            {room.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {room.description}
          </p>
        </div>

        {/* Spotlight track preview */}
        {spotlightTrack ? (
          <div className="bg-echo-neutral-100 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={handlePlayPause}
                className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSpotlightPlaying ? 
                  <Pause className="w-4 h-4" /> : 
                  <Play className="w-4 h-4" />
                }
              </Button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">
                    {spotlightTrack.title}
                  </p>
                  {(room.spotlightIsTrending || spotlightTrack.isRising) && (
                    <Badge variant="secondary" className="bg-rose-100 text-rose-700 border-rose-200">
                      Trending
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {spotlightTrack.creator}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-echo-neutral-100 rounded-lg p-4 mb-4 text-center">
            <Music className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No spotlight track yet</p>
          </div>
        )}

        {/* Admin info */}
        <div className="flex items-center gap-2 mb-4">
          <Avatar className="w-6 h-6 border-2 border-background">
            <AvatarFallback className="text-xs">
              {room.createdBy ? room.createdBy.charAt(0).toUpperCase() : '?'}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            Curated by {room.createdBy || 'Unknown'}
          </span>
        </div>

        {/* Enter room button */}
        <Link to={`/room/${room.id}`} className="block">
          <Button className="w-full btn-enhanced">
            Enter Room
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};
