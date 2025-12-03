import { Tables } from './database';

export interface MediaSubmission {
  id: string;
  title: string;
  creator: string;
  mediaType: 'audio';
  // Provider info (new)
  provider?: 'youtube' | 'soundcloud' | 'audius';
  provider_track_id?: string;
  // Media files
  audioFile?: File;
  videoFile?: File;
  imageFile?: File;
  // Thumbnail/cover
  thumbnail?: string;
  coverArt?: string;
  thumbnailPath?: string;
  // External links
  externalLink?: string;
  videoUrl?: string;
  audioUrl?: string;
  // Metadata
  duration?: number; // in seconds for audio/video
  description?: string;
  fileSize?: number; // in bytes
  dimensions?: { width: number; height: number }; // for images/video
  seasonId?: string;
  seasonTitle?: string;
  seasonStatus?: string;
  seasonStartDate?: string;
  seasonEndDate?: string;
  roomId?: string;
  roomTitle?: string;
  roomSlug?: string;
  submittedBy: {
    id: string;
    username: string;
    avatar?: string;
  };
  boosts: number; // Display boosts (what users see)
  actualBoosts: number; // Weighted boosts for ranking
  boostEvents: BoostEvent[];
  userBoostData: UserBoostData[]; // Track boost counts per user
  boostVelocity: number; // boosts per minute
  velocityTrend: 'rising' | 'steady' | 'declining';
  isRising: boolean;
  risingType?: 'hot' | 'trending' | 'rising-fast';
  submittedAt: Date;
  playCount: number;
  usersBoosted: Set<string>; // Track which users have boosted
  // Admin controls
  isVisible: boolean; // Show/hide from public view
}

// Legacy interface for backward compatibility
export interface MusicSubmission extends MediaSubmission {
  trackTitle: string;
  artist: string;
  soundcloudLink?: string;
}

export type SubmissionPayload = Omit<
  MusicSubmission,
  | 'id'
  | 'boosts'
  | 'actualBoosts'
  | 'userBoostData'
  | 'boostEvents'
  | 'boostVelocity'
  | 'velocityTrend'
  | 'isRising'
  | 'risingType'
  | 'submittedAt'
  | 'playCount'
  | 'usersBoosted'
  | 'isVisible'
>;

export interface UserBoostData {
  userId: string;
  boostCount: number;
  lastBoostTime: Date;
}

export interface BoostEvent {
  id: string;
  submissionId: string;
  userId: string;
  timestamp: Date;
}

export interface VelocityMetrics {
  boostsPerMinute5Min: number;
  boostsPerMinute15Min: number;
  boostsPerMinute1Hr: number;
  trend: 'rising' | 'steady' | 'declining';
  momentum: number; // acceleration/deceleration factor
}

export interface GameState {
  submissions: MediaSubmission[];
  totalPlayers: number;
  competingSubmissions?: number;
  sessionStarted: Date;
  phase: 'submission' | 'voting' | 'results';
}

export type SubmissionWithProfile = Tables<'submissions'> & {
  profiles: Tables<'profiles'>;
  boost_history?: Array<{
    user_id: string;
    boost_count: number;
    last_boost_at: string;
  }>;
};
