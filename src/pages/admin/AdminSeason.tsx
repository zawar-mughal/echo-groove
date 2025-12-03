import { AdminSubmissionsView } from '@/components/admin/AdminSubmissionsView';
import { useSeason } from '@/hooks/api/useSeasons';
import { Season } from '@/types/admin';
import { ErrorState } from '@/components/ui/ErrorState';
import { useNavigate, useParams } from 'react-router-dom';

const AdminSeason = () => {
  const { roomId, seasonId } = useParams<{ roomId: string; seasonId: string }>();
  const navigate = useNavigate();
  const { data: season, isLoading: seasonLoading, error: seasonError, refetch: refetchSeason } = useSeason(seasonId);

  const handleBackToSeasons = () => {
    navigate(`/admin/rooms/${roomId}`);
  };

  const adaptedSeason: Season | null = season ? {
    id: season.id,
    roomId: season.room_id,
    title: season.title,
    description: season.description || '',
    mediaType: season.media_type,
    startDate: new Date(season.start_date),
    endDate: new Date(season.end_date),
    status: season.status,
    submissions: [],
    createdAt: new Date(season.created_at),
    maxSubmissionsPerUser: season.max_submissions_per_user,
  } : null;

  if (seasonLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-lg">Loading season...</div>
      </div>
    );
  }

  if (seasonError || !adaptedSeason) {
    return (
      <div className="flex items-center justify-center py-16">
        <ErrorState
          title="Failed to Load Season"
          message="We couldn't load the season. Please check your connection and try again."
          onRetry={() => refetchSeason()}
        />
      </div>
    );
  }

  return (
    <AdminSubmissionsView
      season={adaptedSeason}
      roomTitle="" // This is not ideal, but we don't have the room title here
      onBack={handleBackToSeasons}
    />
  );
};

export default AdminSeason;
