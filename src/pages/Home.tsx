import React, { useState, useMemo } from 'react';
import { useRooms } from '@/hooks/api/useRooms';
import { RoomCard } from '@/components/home/RoomCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Music, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { profile } = useAuth();

  const { data: rooms = [], isLoading, error, refetch } = useRooms();

  console.log('🏠 Home page render:', { roomsCount: rooms.length, isLoading, error });

  // Filter rooms based on search
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;

    const query = searchQuery.toLowerCase();
    return rooms.filter(room =>
      room.title.toLowerCase().includes(query) ||
      (room.description && room.description.toLowerCase().includes(query))
    );
  }, [rooms, searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading rooms...</div>
        </div>
      </div>
    );
  }

  // Error state
  // if (error) {
  //   return (
  //     <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center p-4">
  //       <h2>{error.message}</h2>
  //       <ErrorState
  //         title="Failed to Load Rooms"
  //         message="We couldn't load the rooms. Please check your connection and try again."
  //         onRetry={() => refetch()}
  //       />
  //     </div>
  //   );
  // }

  // No rooms at all - show welcome state
  if (rooms.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center p-4">
        <EmptyState
          icon={Music}
          title="Welcome to Echo Groove Battle"
          description="No rooms have been created yet. Rooms are where music battles happen! Join the community and create your first room to get started."
          actionLabel={profile?.is_admin ? "Create First Room" : undefined}
          onAction={profile?.is_admin ? () => navigate('/admin') : undefined}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Discover Rooms
              </h1>
              <p className="text-muted-foreground">
                Join a room to vote on tracks and participate in music battles
              </p>
            </div>
            <Badge variant="outline" className="text-echo-neutral-500">
              {filteredRooms.length} {filteredRooms.length === 1 ? 'room' : 'rooms'}
            </Badge>
          </div>

          {/* Search */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Room Grid */}
        {filteredRooms.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No rooms found
            </h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
