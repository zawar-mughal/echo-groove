import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface PlatformPointsData {
  userId: string;
  curatorPoints: number;
  communityPoints: number;
  totalPlatformPoints: number;
  dailyBoostCount: number;
  lastBoostDate: string | null;
  totalBoosts: number;
}

// Fetch user's platform points from database
export const usePlatformPoints = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['platform-points', userId],
    queryFn: async (): Promise<PlatformPointsData | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, curator_points, community_points, platform_points, daily_boost_count, last_boost_date, total_boosts')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        userId: data.id,
        curatorPoints: data.curator_points || 0,
        communityPoints: data.community_points || 0,
        totalPlatformPoints: data.platform_points || 0,
        dailyBoostCount: data.daily_boost_count || 0,
        lastBoostDate: data.last_boost_date,
        totalBoosts: data.total_boosts || 0,
      };
    },
    enabled: !!userId,
    staleTime: 10000, // Cache for 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};

// Check if user can earn more community points today (5 boost limit)
export const useCanEarnCommunityPoints = (userId: string | undefined) => {
  const { data: points } = usePlatformPoints(userId);

  if (!points) return false;

  const today = new Date().toISOString().split('T')[0];
  const isToday = points.lastBoostDate === today;

  return !isToday || points.dailyBoostCount < 5;
};

// Get remaining boosts that will earn community points
export const useRemainingPointBoosts = (userId: string | undefined) => {
  const { data: points } = usePlatformPoints(userId);

  if (!points) return 5;

  const today = new Date().toISOString().split('T')[0];
  const isToday = points.lastBoostDate === today;

  if (!isToday) return 5;

  return Math.max(0, 5 - points.dailyBoostCount);
};

// Fetch user's boost history for a specific submission
export const useBoostHistory = (userId: string | undefined, submissionId: string | undefined) => {
  return useQuery({
    queryKey: ['boost-history', userId, submissionId],
    queryFn: async () => {
      if (!userId || !submissionId) return null;

      const { data, error } = await supabase
        .from('boost_history')
        .select('*')
        .eq('user_id', userId)
        .eq('submission_id', submissionId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!submissionId,
  });
};

// Fetch user's all boost history (for profile page)
export const useAllBoostHistory = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['boost-history', 'all', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('boost_history')
        .select(`
          *,
          submissions:submission_id (
            id,
            title,
            thumbnail_path
          )
        `)
        .eq('user_id', userId)
        .order('last_boost_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

// Fetch user's room scores (for profile page - curator accuracy, etc.)
export const useUserRoomScores = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-room-scores', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_room_scores')
        .select(`
          *,
          rooms:room_id (
            id,
            title,
            slug
          )
        `)
        .eq('user_id', userId)
        .order('total_points', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};
