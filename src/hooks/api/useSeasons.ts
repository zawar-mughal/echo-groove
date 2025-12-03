import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Season = Database['public']['Tables']['seasons']['Row'];
type SeasonInsert = Database['public']['Tables']['seasons']['Insert'];
type SeasonUpdate = Database['public']['Tables']['seasons']['Update'];

// Fetch all seasons for a room
export const useSeasons = (roomId: string | undefined) => {
  return useQuery({
    queryKey: ['seasons', roomId],
    queryFn: async () => {
      if (!roomId) throw new Error('Room ID is required');

      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('room_id', roomId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as Season[];
    },
    enabled: !!roomId,
  });
};

// Fetch active season for a room
export const useActiveSeason = (roomId: string | undefined) => {
  return useQuery({
    queryKey: ['seasons', roomId, 'active'],
    queryFn: async () => {
      if (!roomId) throw new Error('Room ID is required');

      const { data, error} = await supabase
        .from('seasons')
        .select('*')
        .eq('room_id', roomId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data as Season | null;
    },
    enabled: !!roomId,
  });
};

export const useAllSeasons = () => {
  return useQuery({
    queryKey: ['seasons', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as Season[];
    },
  });
};

// Fetch a single season
export const useSeason = (seasonId: string | undefined) => {
  return useQuery({
    queryKey: ['seasons', seasonId],
    queryFn: async () => {
      if (!seasonId) throw new Error('Season ID is required');

      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('id', seasonId)
        .single();

      if (error) throw error;
      return data as Season;
    },
    enabled: !!seasonId,
  });
};

// Create a new season
export const useCreateSeason = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (season: SeasonInsert) => {
      const { data, error } = await supabase
        .from('seasons')
        .insert(season)
        .select()
        .single();

      if (error) throw error;
      return data as Season;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seasons', data.room_id] });
      queryClient.invalidateQueries({ queryKey: ['seasons', data.room_id, 'active'] });
    },
  });
};

// Update a season
export const useUpdateSeason = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: SeasonUpdate }) => {
      const { data, error } = await supabase
        .from('seasons')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0] as Season;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seasons', data.room_id] });
      queryClient.invalidateQueries({ queryKey: ['seasons', data.id] });
      queryClient.invalidateQueries({ queryKey: ['seasons', data.room_id, 'active'] });
    },
  });
};

// Delete a season
export const useDeleteSeason = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (seasonId: string) => {
      const { error } = await supabase
        .from('seasons')
        .delete()
        .eq('id', seasonId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
    },
  });
};
