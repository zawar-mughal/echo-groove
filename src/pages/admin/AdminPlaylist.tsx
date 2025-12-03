import { AdminPlaylistView } from '@/components/admin/AdminPlaylistView';
import { useRoom } from '@/hooks/api/useRooms';
import { Room } from '@/types/admin';
import { toast } from 'sonner';
import { ErrorState } from '@/components/ui/ErrorState';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoomPlaylist, useRemoveTrackFromPlaylist } from '@/hooks/api/usePlaylists';

const AdminPlaylist = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { data: room, isLoading: roomLoading, error: roomError, refetch: refetchRoom } = useRoom(roomId);
  const { data: playlistData, isLoading: playlistLoading } = useRoomPlaylist(roomId);
  const removeTrackMutation = useRemoveTrackFromPlaylist();

  const handleBackToRooms = () => {
    navigate('/admin');
  };

  const handleRemoveFromPlaylist = async (playlistTrackId: string) => {
    if (!roomId) return;
    try {
      await removeTrackMutation.mutateAsync({ playlistTrackId, roomId });
      toast.success("Song removed from playlist");
    } catch (error) {
      console.error('Failed to remove playlist track', error);
      toast.error("Failed to remove song from playlist");
    }
  };

  const adaptedRoom: Room | null = room ? {
    id: room.id,
    title: room.title,
    description: room.description || '',
    slug: room.slug,
    playlist: [],
    discordChannelId: room.discord_channel_id,
    discordGuildId: room.discord_guild_id,
    activeSeasonId: '',
    createdBy: room.created_by || '',
    moderators: room.moderator_ids || [],
    isActive: room.is_active,
    isPublic: room.is_public,
    allowSubmissions: room.allow_submissions,
    createdAt: new Date(room.created_at),
    currentSeason: null,
    seasons: [],
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
    <AdminPlaylistView
      room={adaptedRoom}
      playlistTracks={playlistData?.tracks ?? []}
      isLoading={playlistLoading}
      onBack={handleBackToRooms}
      onRemoveFromPlaylist={handleRemoveFromPlaylist}
    />
  );
};

export default AdminPlaylist;
