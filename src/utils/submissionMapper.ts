import { getPublicAssetUrl } from '@/lib/storage';
import type { MediaSubmission, SubmissionWithProfile } from '@/types/submission';

/**
 * Generate the Audius track page URL from a track ID
 */
const getAudiusTrackUrl = (trackId: string): string => {
  return `https://audius.co/tracks/${trackId}`;
};

/**
 * Get the public URL for an asset, handling both external URLs and Supabase storage paths
 * - If the path is already a full URL (http:// or https://), return it as-is
 * - If the path is a relative Supabase storage path, convert it to a public URL
 */
const getAssetUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;

  // Check if it's already a full URL (external, like Audius artwork)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // It's a Supabase storage path, convert it
  return getPublicAssetUrl(path);
};

/**
 * Normalize a submission record from Supabase into the MediaSubmission shape
 * used throughout the UI.
 */
type SubmissionWithRelations = SubmissionWithProfile & {
  rooms?: {
    id: string;
    title: string | null;
    slug: string | null;
  } | null;
  seasons?: {
    id: string;
    title: string | null;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
  } | null;
};

export const mapSubmissionRecordToMediaSubmission = (
  submission: SubmissionWithRelations
): MediaSubmission => {
  const artworkUrl = getAssetUrl(submission.thumbnail_path);
  const creatorName =
    submission.artist_name ||
    submission.profiles?.username ||
    submission.user_id;
  const submittedByName =
    submission.profiles?.username ||
    creatorName ||
    submission.user_id;
  const season = submission.seasons ?? null;
  const room = submission.rooms ?? null;

  // Generate proper Audius track page URL if available
  const audiusPageUrl =
    submission.provider === 'audius' && submission.provider_track_id
      ? getAudiusTrackUrl(submission.provider_track_id)
      : submission.external_url ?? undefined;

  return {
    id: submission.id,
    title: submission.title,
    creator: creatorName,
    mediaType: 'audio',
    provider: submission.provider ?? 'audius',
    provider_track_id: submission.provider_track_id ?? undefined,
    thumbnail: artworkUrl,
    coverArt: artworkUrl,
    thumbnailPath: submission.thumbnail_path ?? undefined,
    externalLink: audiusPageUrl,
    description: submission.description ?? undefined,
    duration: submission.duration_seconds ?? undefined,
    seasonId: season?.id ?? submission.season_id ?? undefined,
    seasonTitle: season?.title ?? undefined,
    seasonStatus: season?.status ?? undefined,
    seasonStartDate: season?.start_date ?? undefined,
    seasonEndDate: season?.end_date ?? undefined,
    roomId: room?.id ?? submission.room_id ?? undefined,
    roomTitle: room?.title ?? undefined,
    roomSlug: room?.slug ?? undefined,
    audioUrl:
      submission.provider !== 'audius'
        ? submission.external_url ?? undefined
        : undefined,
    submittedBy: {
      id: submission.user_id,
      username: submittedByName,
      avatar: getAssetUrl(submission.profiles?.avatar_url),
    },
    boosts: Number(submission.weighted_boost_count ?? submission.boost_count ?? 0),
    actualBoosts: Number(submission.boost_count ?? submission.weighted_boost_count ?? 0),
    userBoostData: (submission.boost_history ?? []).map(boost => ({
      userId: boost.user_id,
      boostCount: boost.boost_count,
      lastBoostTime: new Date(boost.last_boost_at),
    })),
    boostEvents: [],
    boostVelocity: Number(submission.boost_velocity ?? 0),
    velocityTrend: submission.is_trending ? 'rising' : 'steady',
    isRising: !!submission.is_trending,
    risingType: submission.is_trending ? 'trending' : undefined,
    submittedAt: submission.created_at
      ? new Date(submission.created_at)
      : new Date(),
    playCount: submission.play_count ?? 0,
    usersBoosted: new Set<string>(),
    isVisible: submission.is_visible ?? true,
  };
};
