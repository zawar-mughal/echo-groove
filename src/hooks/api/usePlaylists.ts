import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import type { MediaSubmission, SubmissionWithProfile } from '@/types/submission';
import { mapSubmissionRecordToMediaSubmission } from '@/utils/submissionMapper';

type PlaylistRow = Database['public']['Tables']['playlists']['Row'];
type PlaylistTrackRow = Database['public']['Tables']['playlist_tracks']['Row'];

type PlaylistTrackWithSubmission = PlaylistTrackRow & {
  submissions: SubmissionWithProfile | null;
};

type PlaylistQueryResult = PlaylistRow & {
  playlist_tracks: PlaylistTrackWithSubmission[];
};

export interface PlaylistTrack {
  id: string;
  position: number;
  seasonId: string | null;
  submission: MediaSubmission;
}

export interface RoomPlaylistData {
  playlist: {
    id: string;
    title: string;
    room_id: string;
  } | null;
  tracks: PlaylistTrack[];
}

const ensureRoomPlaylist = async (
  roomId: string,
  curatedBy?: string
): Promise<PlaylistRow> => {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data;
  }

  const { data: createdPlaylist, error: insertError } = await supabase
    .from('playlists')
    .insert({
      room_id: roomId,
      title: 'Room Playlist',
      curated_by: curatedBy,
    })
    .select()
    .single();

  if (insertError || !createdPlaylist) {
    throw insertError;
  }

  return createdPlaylist;
};

export const useRoomPlaylist = (roomId: string | undefined) => {
  return useQuery<RoomPlaylistData>({
    queryKey: ['room-playlist', roomId],
    enabled: !!roomId,
    queryFn: async () => {
      if (!roomId) throw new Error('Room ID is required');

      const { data, error } = await supabase
        .from('playlists')
        .select(`
          id,
          title,
          room_id,
          playlist_tracks (
            id,
            position,
            season_id,
            submission_id,
            submissions (
              *,
              profiles (username, avatar_url)
            )
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .order('position', { ascending: true, foreignTable: 'playlist_tracks' })
        .maybeSingle<PlaylistQueryResult>();

      if (error) throw error;

      if (!data) {
        return { playlist: null, tracks: [] };
      }

      const tracks: PlaylistTrack[] =
        (data.playlist_tracks ?? [])
          .filter(
            (track): track is PlaylistTrackWithSubmission & {
              submissions: SubmissionWithProfile;
            } => !!track?.submissions
          )
          .map((track) => ({
            id: track.id,
            position: track.position,
            seasonId: track.season_id,
            submission: mapSubmissionRecordToMediaSubmission(track.submissions),
          }))
          .sort((a, b) => a.position - b.position);

      return {
        playlist: {
          id: data.id,
          title: data.title,
          room_id: data.room_id,
        },
        tracks,
      };
    },
  });
};

export const useAddTrackToPlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      roomId: string;
      submissionId: string;
      seasonId: string;
      addedBy?: string;
    }) => {
      const { roomId, submissionId, seasonId, addedBy } = params;
      const playlist = await ensureRoomPlaylist(roomId, addedBy);

      const { data: existing } = await supabase
        .from('playlist_tracks')
        .select('id')
        .eq('playlist_id', playlist.id)
        .eq('submission_id', submissionId)
        .maybeSingle();

      if (existing) {
        return playlist.id;
      }

      const { data: lastTrack } = await supabase
        .from('playlist_tracks')
        .select('position')
        .eq('playlist_id', playlist.id)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextPosition = (lastTrack?.position ?? 0) + 1;

      const { error } = await supabase.from('playlist_tracks').insert({
        playlist_id: playlist.id,
        submission_id: submissionId,
        season_id: seasonId,
        added_by: addedBy,
        position: nextPosition,
      });

      if (error) throw error;

      return playlist.id;
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['room-playlist', roomId] });
    },
  });
};

export const useRemoveTrackFromPlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playlistTrackId,
      roomId,
    }: {
      playlistTrackId: string;
      roomId: string;
    }) => {
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('id', playlistTrackId);

      if (error) throw error;
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['room-playlist', roomId] });
    },
  });
};
