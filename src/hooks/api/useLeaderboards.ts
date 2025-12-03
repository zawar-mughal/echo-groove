import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar: string | null;
  totalPoints: number;
  curatorPoints: number;
  communityPoints: number;
}

// Fetch platform-wide leaderboard
export const usePlatformLeaderboard = (limit: number = 10) => {
  return useQuery({
    queryKey: ['leaderboard', 'platform', limit],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, platform_points, curator_points, community_points')
        .order('platform_points', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(profile => ({
        userId: profile.id,
        username: profile.username,
        avatar: profile.avatar_url,
        totalPoints: profile.platform_points || 0,
        curatorPoints: profile.curator_points || 0,
        communityPoints: profile.community_points || 0,
      }));
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};

// Fetch top supporter for a specific room
export const useRoomTopSupporter = (roomId: string | undefined) => {
  return useQuery({
    queryKey: ['leaderboard', 'room', roomId],
    queryFn: async (): Promise<LeaderboardEntry | null> => {
      if (!roomId) return null;

      const { data, error } = await supabase
        .from('user_room_scores')
        .select(`
          user_id,
          total_points,
          curator_points,
          community_points,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .order('total_points', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;

      return {
        userId: data.user_id,
        username: profile?.username || 'Unknown',
        avatar: profile?.avatar_url || null,
        totalPoints: data.total_points || 0,
        curatorPoints: data.curator_points || 0,
        communityPoints: data.community_points || 0,
      };
    },
    enabled: !!roomId,
    staleTime: 30000,
  });
};

// Fetch room leaderboard
export const useRoomLeaderboard = (roomId: string | undefined, limit: number = 10) => {
  return useQuery({
    queryKey: ['leaderboard', 'room', roomId, limit],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      if (!roomId) return [];

      const { data, error } = await supabase
        .from('user_room_scores')
        .select(`
          user_id,
          total_points,
          curator_points,
          community_points,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .order('total_points', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(score => {
        const profile = Array.isArray(score.profiles) ? score.profiles[0] : score.profiles;
        return {
          userId: score.user_id,
          username: profile?.username || 'Unknown',
          avatar: profile?.avatar_url || null,
          totalPoints: score.total_points || 0,
          curatorPoints: score.curator_points || 0,
          communityPoints: score.community_points || 0,
        };
      });
    },
    enabled: !!roomId,
    staleTime: 30000,
    refetchInterval: 60000,
  });
};

// Fetch user's ranking on platform
export const useUserPlatformRank = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-rank', 'platform', userId],
    queryFn: async (): Promise<number | null> => {
      if (!userId) return null;

      // Get user's points
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('platform_points')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      if (!userProfile) return null;

      // Count how many users have more points
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gt('platform_points', userProfile.platform_points || 0);

      if (countError) throw countError;

      return (count || 0) + 1; // Add 1 because rank is 1-indexed
    },
    enabled: !!userId,
    staleTime: 60000,
  });
};

// Fetch user's ranking in a specific room
export const useUserRoomRank = (userId: string | undefined, roomId: string | undefined) => {
  return useQuery({
    queryKey: ['user-rank', 'room', roomId, userId],
    queryFn: async (): Promise<number | null> => {
      if (!userId || !roomId) return null;

      // Get user's room score
      const { data: userScore, error: userError } = await supabase
        .from('user_room_scores')
        .select('total_points')
        .eq('user_id', userId)
        .eq('room_id', roomId)
        .maybeSingle();

      if (userError) throw userError;
      if (!userScore) return null;

      // Count how many users have more points in this room
      const { count, error: countError } = await supabase
        .from('user_room_scores')
        .select('id', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .gt('total_points', userScore.total_points || 0);

      if (countError) throw countError;

      return (count || 0) + 1;
    },
    enabled: !!userId && !!roomId,
    staleTime: 60000,
  });
};
