import React from 'react';
import { TrendingRoom } from '@/utils/roomDiscovery';
import { TrendingRoomCard } from './TrendingRoomCard';
import { Flame, TrendingUp, Activity } from 'lucide-react';

interface TrendingRoomsSectionProps {
  trendingRooms: TrendingRoom[];
  onPlayTrack: (trackId: string) => void;
  currentlyPlaying?: string;
}

export const TrendingRoomsSection: React.FC<TrendingRoomsSectionProps> = ({
  trendingRooms,
  onPlayTrack,
  currentlyPlaying,
}) => {
  if (trendingRooms.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-secondary" />
          <h2 className="text-2xl font-bold text-foreground">Trending Rooms</h2>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Activity className="w-4 h-4" />
          <span>Most active in the last 24h</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trendingRooms.map((room) => (
          <TrendingRoomCard
            key={room.id}
            room={room}
            onPlayTrack={onPlayTrack}
            currentlyPlaying={currentlyPlaying}
          />
        ))}
      </div>
    </section>
  );
};