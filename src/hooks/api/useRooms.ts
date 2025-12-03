import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Room = Database['public']['Tables']['rooms']['Row'];
type RoomInsert = Database['public']['Tables']['rooms']['Insert'];
type RoomUpdate = Database['public']['Tables']['rooms']['Update'];

export type RoomWithActive = Room & { has_active_season: boolean };

type RoomRowWithCounts = Room & {
  seasons?: { count: number }[];
  submissions?: { count: number }[];
  room_memberships?: { count: number }[];
};

const ROOM_SELECT_WITH_COUNTS = `
  *,
  seasons:seasons!seasons_room_id_fkey(count),
  submissions:submissions!submissions_room_id_fkey(count),
  room_memberships:room_memberships!room_memberships_room_id_fkey(count)
`;

const normalizeRoom = ({
  seasons,
  submissions,
  room_memberships,
  ...room
}: RoomRowWithCounts): Room => ({
  ...room,
  total_submissions:
    submissions?.[0]?.count ?? room.total_submissions ?? 0,
  total_seasons:
    seasons?.[0]?.count ?? room.total_seasons ?? 0,
  total_members:
    room_memberships?.[0]?.count ?? room.total_members ?? 0,
});

const fetchActiveRoomIdSet = async (roomIds: string[]) => {
  if (roomIds.length === 0) {
    return new Set<string>();
  }

  const { data, error } = await supabase
    .from('seasons')
    .select('room_id')
    .in('room_id', roomIds)
    .eq('status', 'active');

  if (error) {
    throw error;
  }

  const activeIds = new Set<string>();
  ((data ?? []) as { room_id: string | null }[]).forEach((season) => {
    if (season.room_id) {
      activeIds.add(season.room_id);
    }
  });
  return activeIds;
};

const attachActiveSeasonFlag = async (rooms: Room[]): Promise<RoomWithActive[]> => {
  const activeIds = await fetchActiveRoomIdSet(rooms.map((room) => room.id));
  return rooms.map((room) => ({
    ...room,
    has_active_season: activeIds.has(room.id),
  }));
};

// Fetch all public rooms
export const useRooms = () => {
  return useQuery<RoomWithActive[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      console.log('🔍 Fetching rooms from Supabase...');

      const { data, error } = await supabase
        .from('rooms')
        .select(ROOM_SELECT_WITH_COUNTS)
        .eq('is_active', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching rooms:', error);
        throw error;
      }

      const normalizedRooms: Room[] = (data as RoomRowWithCounts[]).map(normalizeRoom);
      const roomsWithStatus = await attachActiveSeasonFlag(normalizedRooms);

      console.log('✅ Rooms fetched successfully:', roomsWithStatus);
      return roomsWithStatus;
    },
  });
};

// Fetch a single room by ID
export const useRoom = (roomId: string | undefined) => {
  return useQuery<RoomWithActive | null>({
    queryKey: ['rooms', roomId],
    queryFn: async () => {
      if (!roomId) throw new Error('Room ID is required');

      const { data, error } = await supabase
        .from('rooms')
        .select(ROOM_SELECT_WITH_COUNTS)
        .eq('id', roomId)
        .single();

      if (error) throw error;
      const normalized = normalizeRoom(data as RoomRowWithCounts);
      const activeIds = await fetchActiveRoomIdSet([normalized.id]);

      return {
        ...normalized,
        has_active_season: activeIds.has(normalized.id),
      };
    },
    enabled: !!roomId,
  });
};

// Fetch a room by slug
export const useRoomBySlug = (slug: string | undefined) => {
  return useQuery<RoomWithActive | null>({
    queryKey: ['rooms', 'slug', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Slug is required');

      const { data, error } = await supabase
        .from('rooms')
        .select(ROOM_SELECT_WITH_COUNTS)
        .eq('slug', slug)
        .single();

      if (error) throw error;
      const normalized = normalizeRoom(data as RoomRowWithCounts);
      const activeIds = await fetchActiveRoomIdSet([normalized.id]);

      return {
        ...normalized,
        has_active_season: activeIds.has(normalized.id),
      };
    },
    enabled: !!slug,
  });
};

// Create a new room
export const useCreateRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (room: RoomInsert) => {
      const { data, error } = await supabase
        .from('rooms')
        .insert(room)
        .select()
        .single();

      if (error) throw error;
      return data as Room;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

// Update a room
export const useUpdateRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RoomUpdate }) => {
      const { data, error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Room;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', data.id] });
    },
  });
};

// Delete a room (admin only)
export const useDeleteRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};
