import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Users, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Database } from '@/types/database';
import { cn } from '@/lib/utils';

type Room = (Database['public']['Tables']['rooms']['Row']) & {
  has_active_season?: boolean;
};

interface RoomCardProps {
  room: Room;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const isOpen = room.has_active_season ?? !!room.allow_submissions;

  return (
    <Card className="group hover-lift hover-glow bg-gradient-to-br from-card to-card/80 border border-echo-neutral-300">
      <CardContent className="p-6 flex flex-col h-full">
        {/* Room Title */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-lg text-foreground line-clamp-1">
              {room.title}
            </h3>
            <Badge
              variant="outline"
              className={cn(
                'text-xs font-semibold px-2 py-0.5 border transition-colors',
                isOpen
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/40'
                  : 'bg-muted text-muted-foreground border-muted-foreground/40'
              )}
            >
              {isOpen ? 'Open' : 'Closed'}
            </Badge>
          </div>
          {room.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {room.description}
            </p>
          )}
        </div>

        {/* Room Stats */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Music className="w-3 h-3" />
            <span className="text-xs">{room.total_submissions} tracks</span>
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span className="text-xs">{room.total_seasons} seasons</span>
          </Badge>
          {room.total_members > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span className="text-xs">{room.total_members} members</span>
            </Badge>
          )}
        </div>

        {/* Enter Room Button */}
        <Link to={`/room/${room.slug}`} className="mt-auto block">
          <Button className="w-full btn-enhanced">
            Enter Room
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};
