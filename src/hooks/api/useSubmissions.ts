import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { withAudiusSdk } from '@/lib/audius';
import type { Database } from '@/types/database';
import type { MediaSubmission, SubmissionWithProfile } from '@/types/submission';
import { mapSubmissionRecordToMediaSubmission } from '@/utils/submissionMapper';

type Submission = Database['public']['Tables']['submissions']['Row'];
type SubmissionInsert = Database['public']['Tables']['submissions']['Insert'];
type SubmissionUpdate = Database['public']['Tables']['submissions']['Update'];

// Fetch submissions for a season
export const useSubmissions = (
  seasonId: string | undefined,
  options?: { includeHidden?: boolean }
) => {
  const includeHidden = options?.includeHidden ?? false;

  return useQuery({
    queryKey: ['submissions', seasonId],
    queryFn: async () => {
      if (!seasonId) throw new Error('Season ID is required');

      let query = supabase
        .from('submissions')
        .select(`
          *,
          profiles(username, avatar_url),
          boost_history(user_id, boost_count, last_boost_at)
        `)
        .eq('season_id', seasonId)
        .order('weighted_boost_count', { ascending: false });

      if (!includeHidden) {
        query = query.eq('is_visible', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SubmissionWithProfile[];
    },
    enabled: !!seasonId,
  });
};

// Fetch submissions for a room (across all seasons)
export const useRoomSubmissions = (roomId: string | undefined) => {
  return useQuery({
    queryKey: ['submissions', 'room', roomId],
    queryFn: async () => {
      if (!roomId) throw new Error('Room ID is required');

      const { data, error } = await supabase
        .from('submissions')
        .select('*, profiles(username, avatar_url)')
        .eq('room_id', roomId)
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SubmissionWithProfile[];
    },
    enabled: !!roomId,
  });
};

type SubmissionWithProfileAndRoom = SubmissionWithProfile & {
  rooms: {
    id: string;
    title: string | null;
    slug: string | null;
  } | null;
  seasons: {
    id: string;
    title: string | null;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
  } | null;
};

export interface UserSubmissionListItem {
  submission: MediaSubmission;
  room: {
    id: string;
    title: string;
    slug: string;
  } | null;
  season: {
    id: string;
    title: string;
    status: string | null;
    startDate: string | null;
    endDate: string | null;
  } | null;
}

type SubmissionSeasonRecord = {
  id: string;
  created_at: string;
  seasons: {
    id: string;
    title: string | null;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
    rooms: {
      id: string;
      title: string | null;
      slug: string | null;
    } | null;
  } | null;
};

export interface SubmissionSeasonHistoryItem {
  submissionId: string;
  createdAt: string;
  season: {
    id: string;
    title: string | null;
    status: string | null;
    startDate: string | null;
    endDate: string | null;
    room: {
      id: string;
      title: string | null;
      slug: string | null;
    } | null;
  } | null;
}

export const useUserSubmissions = (userId: string | undefined) => {
  return useQuery<UserSubmissionListItem[]>({
    queryKey: ['submissions', 'user', userId],
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles:profiles!submissions_user_id_fkey (username, avatar_url),
          rooms:rooms!submissions_room_id_fkey (id, title, slug),
          seasons:seasons!submissions_season_id_fkey (id, title, status, start_date, end_date)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const records = (data as SubmissionWithProfileAndRoom[]) ?? [];

      const mapped = records.map((record) => ({
        submission: mapSubmissionRecordToMediaSubmission(record),
        room: record.rooms
          ? {
              id: record.rooms.id,
              title: record.rooms.title ?? 'Unknown room',
              slug: record.rooms.slug ?? '',
            }
          : null,
        season: record.seasons
          ? {
              id: record.seasons.id,
              title: record.seasons.title ?? 'Untitled season',
              status: record.seasons.status ?? null,
              startDate: record.seasons.start_date,
              endDate: record.seasons.end_date,
            }
          : null,
      }));

      return mapped;
    },
    enabled: !!userId,
  });
};

export const useSubmissionSeasonHistory = (
  submissionId: string | undefined,
  providerTrackId?: string | null
) => {
  return useQuery<SubmissionSeasonHistoryItem[]>({
    queryKey: ['submission-season-history', providerTrackId ?? submissionId],
    enabled: !!(providerTrackId || submissionId),
    queryFn: async () => {
      const identifierValue = providerTrackId ?? submissionId;
      if (!identifierValue) {
        return [];
      }

      const column = providerTrackId ? 'provider_track_id' : 'id';

      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          created_at,
          seasons:seasons!submissions_season_id_fkey (
            id,
            title,
            status,
            start_date,
            end_date,
            rooms:rooms!seasons_room_id_fkey (
              id,
              title,
              slug
            )
          )
        `)
        .eq(column, identifierValue)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const records = (data as SubmissionSeasonRecord[] | null) ?? [];

      return records.map((record) => ({
        submissionId: record.id,
        createdAt: record.created_at,
        season: record.seasons
          ? {
              id: record.seasons.id,
              title: record.seasons.title,
              status: record.seasons.status,
              startDate: record.seasons.start_date,
              endDate: record.seasons.end_date,
              room: record.seasons.rooms
                ? {
                    id: record.seasons.rooms.id,
                    title: record.seasons.rooms.title,
                    slug: record.seasons.rooms.slug,
                  }
                : null,
            }
          : null,
      }));
    },
  });
};

// Fetch a single submission
export const useSubmission = (submissionId: string | undefined) => {
  return useQuery({
    queryKey: ['submissions', submissionId],
    queryFn: async () => {
      if (!submissionId) throw new Error('Submission ID is required');

      const { data, error } = await supabase
        .from('submissions')
        .select('*, profiles(username, avatar_url)')
        .eq('id', submissionId)
        .single();

      if (error) throw error;
      return data as SubmissionWithProfile;
    },
    enabled: !!submissionId,
  });
};

// Fetch trending submissions
export const useTrendingSubmissions = (limit: number = 20) => {
  return useQuery({
    queryKey: ['submissions', 'trending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('is_trending', true)
        .eq('is_visible', true)
        .order('trending_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Submission[];
    },
  });
};

// Search all submissions by title
export const useSearchSubmissions = (searchQuery: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['submissions', 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      const { data, error } = await supabase
        .from('submissions')
        .select('*, profiles(username)')
        .ilike('title', `%${searchQuery}%`)
        .eq('is_visible', true)
        .order('weighted_boost_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as SubmissionWithProfile[];
    },
    enabled: searchQuery.length >= 2,
  });
};

// Create a new submission
export const useCreateSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submission: SubmissionInsert) => {
      const { data, error } = await supabase
        .from('submissions')
        .insert(submission)
        .select()
        .single();

      if (error) throw error;
      return data as Submission;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submissions', data.season_id] });
      queryClient.invalidateQueries({ queryKey: ['submissions', 'room', data.room_id] });
    },
  });
};

// Update a submission
export const useUpdateSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: SubmissionUpdate }) => {
      const { data, error } = await supabase
        .from('submissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Submission;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submissions', data.id] });
    },
  });
};

// Delete a submission
export const useDeleteSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submissionId: string) => {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', submissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
};

// Create submission from Audius track
export const useCreateAudiusSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      audiusTrackId: string;
      seasonId: string;
      roomId: string;
      userId: string;
    }) => {
      const { audiusTrackId, seasonId, roomId, userId } = params;

      // Fetch track metadata from Audius
      const { data: track } = await withAudiusSdk((sdk) =>
        sdk.tracks.getTrack({ trackId: audiusTrackId })
      );

      if (!track) {
        throw new Error('Track not found on Audius');
      }

      if (!track.isStreamable) {
        throw new Error('This track is not streamable and cannot be submitted.');
      }

      // Get stream URL
      const streamUrl = await withAudiusSdk((sdk) =>
        sdk.tracks.getTrackStreamUrl({ trackId: audiusTrackId })
      );

      if (!streamUrl) {
        throw new Error('Could not retrieve stream URL for this track.');
      }

      // Create submission in database
      const submission: SubmissionInsert = {
        season_id: seasonId,
        room_id: roomId,
        user_id: userId,
        provider: 'audius',  // Changed from provider_type to provider
        provider_track_id: audiusTrackId,
        external_url: streamUrl,  // Changed from media_url to external_url
        media_type: 'audio',
        title: track.title,
        artist_name: track.user.name,
        duration_seconds: track.duration,
        thumbnail_path: track.artwork?._480x480 || track.artwork?._1000x1000,  // Changed from artwork_url to thumbnail_path
        is_visible: true,
      };

      const { data, error } = await supabase
        .from('submissions')
        .insert(submission)
        .select()
        .single();

      if (error) throw error;

      return data as Submission;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submissions', data.season_id] });
      queryClient.invalidateQueries({ queryKey: ['submissions', 'room', data.room_id] });
      queryClient.invalidateQueries({ queryKey: ['room-submitted-tracks', data.room_id] });
      queryClient.invalidateQueries({ queryKey: ['season-submitted-tracks', data.season_id] });
    },
  });
};
