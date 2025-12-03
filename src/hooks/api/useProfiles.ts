import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export const useProfileByUsername = (username: string | undefined) => {
  return useQuery<ProfileRow | null>({
    queryKey: ['profiles', 'username', username],
    queryFn: async () => {
      if (!username) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (error) throw error;
      return data ?? null;
    },
    enabled: !!username,
  });
};

export const useProfileById = (userId: string | undefined) => {
  return useQuery<ProfileRow | null>({
    queryKey: ['profiles', 'id', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data ?? null;
    },
    enabled: !!userId,
  });
};
