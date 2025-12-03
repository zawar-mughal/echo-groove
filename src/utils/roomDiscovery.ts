import { Room, Season } from '@/types/admin';
import { MediaSubmission } from '@/types/submission';
import { getTrendingSubmission } from '@/utils/submissionSorting';

export interface RoomWithStats extends Room {
  totalMembers: number;
  totalSubmissions: number;
  recentBoosts: number;
  heatScore: number;
  spotlightSubmission?: MediaSubmission;
  spotlightIsTrending: boolean;
  playlistLength: number;
  lastActivity: Date;
  completionRate: number;
}

export interface TrendingRoom extends RoomWithStats {
  trendingScore: number;
  velocityIndicator: 'fire' | 'hot' | 'rising';
}

export type RoomSortOption = 'trending' | 'members' | 'submissions' | 'recent' | 'playlist-length';

// Calculate room heat based on recent boost activity
export const calculateRoomHeat = (room: Room, submissions: MediaSubmission[]): number => {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last2Hours = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  let recentBoosts = 0;
  let ultraRecentBoosts = 0;

  submissions.forEach(submission => {
    submission.boostEvents.forEach(boost => {
      if (boost.timestamp > last24Hours) {
        recentBoosts++;
        if (boost.timestamp > last2Hours) {
          ultraRecentBoosts++;
        }
      }
    });
  });

  // Weight ultra-recent activity more heavily
  return ultraRecentBoosts * 3 + recentBoosts;
};

// Get room statistics and featured tracks
export const enhanceRoomWithStats = (room: Room, allSubmissions: MediaSubmission[]): RoomWithStats => {
  // Get submissions for this room (would normally filter by roomId)
  const roomSubmissions = allSubmissions.filter(s => s.isVisible);
  
  // Calculate unique contributors
  const uniqueContributors = new Set(roomSubmissions.map(s => s.submittedBy.id));
  
  // Get recent boosts (last 24 hours)
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const recentBoosts = roomSubmissions.reduce((total, submission) => {
    return total + submission.boostEvents.filter(boost => boost.timestamp > last24Hours).length;
  }, 0);

  const trendingSubmission = getTrendingSubmission(roomSubmissions);

  let spotlightSubmission: MediaSubmission | undefined;
  if (trendingSubmission) {
    spotlightSubmission = trendingSubmission;
  } else if (roomSubmissions.length > 0) {
    spotlightSubmission = [...roomSubmissions].sort((a, b) => b.actualBoosts - a.actualBoosts)[0];
  }

  // Calculate completion rate based on seasons
  const completedSeasons = room.seasons.filter(s => s.status === 'completed').length;
  const completionRate = room.seasons.length > 0 ? completedSeasons / room.seasons.length : 0;

  // Get last activity date
  const lastActivity = roomSubmissions.length > 0 
    ? new Date(Math.max(...roomSubmissions.map(s => s.submittedAt.getTime())))
    : room.createdAt;

  return {
    ...room,
    totalMembers: uniqueContributors.size,
    totalSubmissions: roomSubmissions.length,
    recentBoosts,
    heatScore: calculateRoomHeat(room, roomSubmissions),
    spotlightSubmission,
    spotlightIsTrending: Boolean(trendingSubmission),
    playlistLength: room.playlist?.length || 0,
    lastActivity,
    completionRate,
  };
};

// Get trending rooms with velocity indicators
export const getTrendingRooms = (rooms: RoomWithStats[], limit: number = 6): TrendingRoom[] => {
  return rooms
    .map(room => {
      const velocityIndicator: 'fire' | 'hot' | 'rising' = 
        room.heatScore > 20 ? 'fire' : 
        room.heatScore > 10 ? 'hot' : 
        'rising';
      
      return {
        ...room,
        trendingScore: room.heatScore + (room.recentBoosts * 0.5) + (room.totalMembers * 0.1),
        velocityIndicator,
      };
    })
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, limit);
};

// Sort rooms by different criteria
export const sortRooms = (rooms: RoomWithStats[], sortBy: RoomSortOption): RoomWithStats[] => {
  switch (sortBy) {
    case 'trending':
      return rooms.sort((a, b) => b.heatScore - a.heatScore);
    case 'members':
      return rooms.sort((a, b) => b.totalMembers - a.totalMembers);
    case 'submissions':
      return rooms.sort((a, b) => b.totalSubmissions - a.totalSubmissions);
    case 'recent':
      return rooms.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    case 'playlist-length':
      return rooms.sort((a, b) => b.playlistLength - a.playlistLength);
    default:
      return rooms;
  }
};

// Filter rooms by criteria
export const filterRooms = (rooms: RoomWithStats[], filters: {
  hasActiveSession?: boolean;
  minMembers?: number;
  recentlyActive?: boolean;
}): RoomWithStats[] => {
  return rooms.filter(room => {
    if (filters.hasActiveSession && !room.currentSeason) return false;
    if (filters.minMembers && room.totalMembers < filters.minMembers) return false;
    if (filters.recentlyActive) {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      if (room.lastActivity < twoDaysAgo) return false;
    }
    return true;
  });
};
