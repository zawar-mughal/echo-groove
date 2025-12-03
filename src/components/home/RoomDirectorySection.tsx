import React from 'react';
import { RoomWithStats } from '@/utils/roomDiscovery';
import { RoomPlaylistCard } from './RoomPlaylistCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Music, 
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface RoomDirectorySectionProps {
  rooms: RoomWithStats[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPlayTrack: (trackId: string) => void;
  currentlyPlaying?: string;
}

export const RoomDirectorySection: React.FC<RoomDirectorySectionProps> = ({
  rooms,
  searchQuery,
  onSearchChange,
  onPlayTrack,
  currentlyPlaying,
}) => {

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-foreground">Discover Rooms</h2>
          <Badge variant="outline" className="text-echo-neutral-500">
            {rooms.length} rooms
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Room Grid */}
      {rooms.length === 0 ? (
        <div className="text-center py-12">
          <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No rooms found
          </h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <RoomPlaylistCard
              key={room.id}
              room={room}
              onPlayTrack={onPlayTrack}
              currentlyPlaying={currentlyPlaying}
            />
          ))}
        </div>
      )}
    </section>
  );
};