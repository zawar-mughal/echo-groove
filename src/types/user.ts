export interface UserScore {
  userId: string;
  totalScore: number;
  boostPoints: number; // Points for boosting in active seasons
  curatorPoints: number; // Points for boosting songs that make it to room playlists
  communityPoints: number; // Points from decay-capped boost score
  totalPlatformPoints: number; // Combined curator + community points
  consistencyMultiplier: number; // Bonus for regular participation
  roomScores: RoomScore[]; // Breakdown by room
  lastUpdated: Date;
}

export interface RoomScore {
  roomId: string;
  boostCount: number;
  curatorAccuracy: number; // Percentage of boosts that made it to playlist
  participationStreak: number; // Consecutive seasons participated
  topSupporter: boolean; // Top booster in this room
}

export interface BoostMetrics {
  totalBoosts: number;
  seasonBoosts: number; // Boosts in current active seasons
  curatorHits: number; // Boosts that later became playlist tracks
  curatorMisses: number; // Boosts that didn't make playlists
  consistency: number; // How regularly user participates
}

export interface CuratorMetrics {
  accuracy: number; // Percentage of successful predictions
  earlyBoosts: number; // Count of being early supporter of playlist tracks
  discoveryBonus: number; // Points for finding hidden gems
  tastemaker: boolean; // Consistently good at predicting winners
}

export interface PlatformPointsData {
  userId: string;
  curatorPoints: number;
  communityPoints: number;
  totalPlatformPoints: number;
  dailyBoostCount: number;
  lastBoostDate: string; // ISO date string
  boostHistory: SongBoostHistory[];
  sevenDayHistory: DailyPointsEntry[];
}

export interface SongBoostHistory {
  songId: string;
  boostCount: number;
  firstBoostDate: Date;
  lastBoostDate: Date;
  communityPointsEarned: number;
  isPlaylistSelected?: boolean;
  curatorPointsEarned?: number;
}

export interface DailyPointsEntry {
  date: string; // ISO date string
  communityPoints: number;
  curatorPoints: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  totalPoints: number;
  curatorPoints: number;
  communityPoints: number;
}