import { AdminSeasonsView } from '@/components/admin/AdminSeasonsView';
import { useRoom } from '@/hooks/api/useRooms';
import { useSeasons, useCreateSeason, useUpdateSeason } from '@/hooks/api/useSeasons';
import { Room, Season } from '@/types/admin';
import { toast } from 'sonner';
import { ErrorState } from '@/components/ui/ErrorState';
import { useNavigate, useParams } from 'react-router-dom';

const AdminRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { data: room, isLoading: roomLoading, error: roomError, refetch: refetchRoom } = useRoom(roomId);
  const { data: seasons = [] } = useSeasons(roomId);
  const createSeasonMutation = useCreateSeason();
  const updateSeasonMutation = useUpdateSeason();

  const handleSelectSeason = (seasonId: string) => {
    navigate(`/admin/rooms/${roomId}/seasons/${seasonId}`);
  };

  const handleBackToRooms = () => {
    navigate('/admin');
  };

  const handleCreateSeason = async (seasonData: Omit<Season, 'id' | 'createdAt' | 'submissions'>) => {
    if (!roomId) return;

    try {
      await createSeasonMutation.mutateAsync({
        room_id: roomId,
        title: seasonData.title,
        start_date: seasonData.startDate.toISOString(),
        end_date: seasonData.endDate.toISOString(),
        status: 'active',
        media_type: 'audio',
        max_submissions_per_user: seasonData.maxSubmissionsPerUser,
      });
      toast.success("Season created successfully");
    } catch (error) {
      toast.error("Failed to create season");
    }
  };

  const handleUpdateSeason = async (seasonId: string, updates: Partial<Season>) => {
    try {
      await updateSeasonMutation.mutateAsync({
        id: seasonId,
        updates: {
          title: updates.title,
          status: updates.status,
          max_submissions_per_user: updates.maxSubmissionsPerUser,
          end_date: updates.endDate ? updates.endDate.toISOString() : undefined,
        }
      });
      toast.success("Season updated successfully");
    } catch (error) {
      toast.error("Failed to update season");
    }
  };

  const handleEndSeason = async (seasonId: string) => {
    try {
      await updateSeasonMutation.mutateAsync({
        id: seasonId,
        updates: { status: 'completed' }
      });
      toast.success("Season ended successfully");
    } catch (error) {
      toast.error("Failed to end season");
    }
  };

  const adaptedSeasons: Season[] = seasons.map(s => ({
    id: s.id,
    roomId: s.room_id,
    title: s.title,
    description: s.description || '',
    mediaType: s.media_type,
    startDate: new Date(s.start_date),
    endDate: new Date(s.end_date),
    status: s.status,
    submissions: [],
    createdAt: new Date(s.created_at),
    maxSubmissionsPerUser: s.max_submissions_per_user,
  }));

  const adaptedRoom: Room | null = room ? {
    id: room.id,
    title: room.title,
    description: room.description || '',
    slug: room.slug,
    playlist: [],
    discordChannelId: room.discord_channel_id,
    discordGuildId: room.discord_guild_id,
    activeSeasonId: adaptedSeasons.find(s => s.status === 'active')?.id || '',
    createdBy: room.created_by || '',
    moderators: room.moderator_ids || [],
    isActive: room.is_active,
    isPublic: room.is_public,
    allowSubmissions: room.allow_submissions,
    createdAt: new Date(room.created_at),
    currentSeason: adaptedSeasons.find(s => s.status === 'active'),
    seasons: adaptedSeasons,
    stats: {
      totalSubmissions: room.total_submissions,
      totalSeasons: room.total_seasons,
      totalMembers: room.total_members
    }
  } : null;

  if (roomLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-lg">Loading room...</div>
      </div>
    );
  }

  if (roomError || !adaptedRoom) {
    return (
      <div className="flex items-center justify-center py-16">
        <ErrorState
          title="Failed to Load Room"
          message="We couldn't load the room. Please check your connection and try again."
          onRetry={() => refetchRoom()}
        />
      </div>
    );
  }

  return (
    <AdminSeasonsView
      room={adaptedRoom}
      onBack={handleBackToRooms}
      onSelectSeason={handleSelectSeason}
      onCreateSeason={handleCreateSeason}
      onUpdateSeason={handleUpdateSeason}
      onEndSeason={handleEndSeason}
    />
  );
};

export default AdminRoom;
