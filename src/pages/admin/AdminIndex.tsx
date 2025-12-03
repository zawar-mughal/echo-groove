import { AdminRoomsList } from '@/components/admin/AdminRoomsList';
import { useRooms } from '@/hooks/api/useRooms';
import { useAllSeasons } from '@/hooks/api/useSeasons';
import { Room } from '@/types/admin';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminIndex = () => {
  const navigate = useNavigate();
  const { data: rooms = [], isLoading: roomsLoading, error: roomsError, refetch: refetchRooms } = useRooms();
  const { data: seasons = [] } = useAllSeasons();

  const handleSelectRoom = (roomId: string) => {
    navigate(`/admin/rooms/${roomId}`);
  };

  const handleAddAdmin = (roomId: string) => {
    toast.info("Admin management coming soon");
  };

  const handleLinkDiscord = (roomId: string) => {
    toast.info("Discord integration coming soon");
  };

  const handleShowPlaylist = (roomId: string) => {
    navigate(`/admin/rooms/${roomId}/playlist`);
  };

  const adaptedRooms: Room[] = rooms.map(room => {
    const roomSeasons = seasons.filter(s => s.room_id === room.id);
    const activeSeason = roomSeasons.find(s => s.status === 'active');

    return {
      id: room.id,
      title: room.title,
      description: room.description || '',
      slug: room.slug,
      playlist: [],
      discordChannelId: room.discord_channel_id,
      discordGuildId: room.discord_guild_id,
      activeSeasonId: activeSeason?.id || '',
      createdBy: room.created_by || '',
      moderators: room.moderator_ids || [],
      isActive: room.is_active,
      isPublic: room.is_public,
      allowSubmissions: room.allow_submissions,
      createdAt: new Date(room.created_at),
      currentSeason: activeSeason as any,
      seasons: roomSeasons as any[],
      stats: {
        totalSubmissions: room.total_submissions,
        totalSeasons: room.total_seasons,
        totalMembers: room.total_members
      }
    };
  });

  if (roomsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-lg">Loading rooms...</div>
      </div>
    );
  }

  if (roomsError) {
    return (
      <div className="flex items-center justify-center py-16">
        <ErrorState
          title="Failed to Load Rooms"
          message="We couldn't load the rooms for the admin panel. Please check your connection and try again."
          onRetry={() => refetchRooms()}
        />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <EmptyState
          icon={Settings}
          title="No Rooms Yet"
          description="You haven't created any rooms yet. Rooms are where music battles happen! Create your first room to get started with organizing music competitions."
        />
      </div>
    );
  }

  return (
    <AdminRoomsList
      rooms={adaptedRooms}
      onSelectRoom={handleSelectRoom}
      onAddAdmin={handleAddAdmin}
      onLinkDiscord={handleLinkDiscord}
      onShowPlaylist={handleShowPlaylist}
    />
  );
};

export default AdminIndex;
