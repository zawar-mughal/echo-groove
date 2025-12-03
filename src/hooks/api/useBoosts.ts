import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Boost = Database['public']['Tables']['boosts']['Row'];
type BoostInsert = Database['public']['Tables']['boosts']['Insert'];

// Fetch user's boosts for a submission (to check if already boosted)
export const useUserBoost = (submissionId: string | undefined, userId: string | undefined) => {
  return useQuery({
    queryKey: ['boosts', submissionId, userId],
    queryFn: async () => {
      if (!submissionId || !userId) return null;

      const { data, error } = await supabase
        .from('boosts')
        .select('*')
        .eq('submission_id', submissionId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as Boost | null;
    },
    enabled: !!submissionId && !!userId,
  });
};

// Fetch all boosts for a user
export const useUserBoosts = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['boosts', 'user', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      const { data, error } = await supabase
        .from('boosts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Boost[];
    },
    enabled: !!userId,
  });
};

// Create a boost (vote for a submission)
export const useCreateBoost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boost: BoostInsert) => {
      const { data, error } = await supabase
        .from('boosts')
        .insert(boost)
        .select()
        .single();

      if (error) throw error;
      return data as Boost;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['boosts', data.submission_id, data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['boosts', 'user', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['submissions', data.submission_id] });
      queryClient.invalidateQueries({ queryKey: ['submissions', data.season_id] });
    },
  });
};

// Add a boost (infinite boosts with diminishing returns)
// Replaces toggle logic - users can boost infinitely
export const useAddBoost = () => {
  const createBoost = useCreateBoost();

  return useMutation({
    mutationFn: async ({
      submissionId,
      userId,
      seasonId,
    }: {
      submissionId: string;
      userId: string;
      seasonId: string;
    }) => {
      // Always add a new boost (no toggle, no delete)
      // Weight and points calculated automatically by database triggers
      return createBoost.mutateAsync({
        submission_id: submissionId,
        user_id: userId,
        season_id: seasonId,
      });
    },
  });
};

// Fetch boost count for a user on a specific submission
export const useUserBoostCount = (submissionId: string | undefined, userId: string | undefined) => {
  return useQuery({
    queryKey: ['boost-count', submissionId, userId],
    queryFn: async () => {
      if (!submissionId || !userId) return 0;

      const { data, error } = await supabase
        .from('boost_history')
        .select('boost_count')
        .eq('submission_id', submissionId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data?.boost_count || 0;
    },
    enabled: !!submissionId && !!userId,
  });
};
