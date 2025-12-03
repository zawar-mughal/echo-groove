import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AudiusTrack, SelectableAudiusTrack } from '@/types/audius';

/**
 * Fetch all Audius track IDs that have been submitted to a specific room
 */
export const useRoomSubmittedTracks = (roomId: string | undefined) => {
  return useQuery({
    queryKey: ['room-submitted-tracks', roomId],
    queryFn: async () => {
      if (!roomId) throw new Error('Room ID is required');

      const { data, error } = await supabase
        .from('submissions')
        .select('provider_track_id')
        .eq('room_id', roomId)
        .eq('provider_type', 'audius')
        .eq('is_visible', true);

      if (error) throw error;

      // Return Set of track IDs for fast lookup
      return new Set(data?.map(s => s.provider_track_id).filter(Boolean) || []);
    },
    enabled: !!roomId,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });
};

/**
 * Fetch all Audius track IDs that have been submitted to a specific season
 */
export const useSeasonSubmittedTracks = (seasonId: string | undefined) => {
  return useQuery({
    queryKey: ['season-submitted-tracks', seasonId],
    queryFn: async () => {
      if (!seasonId) throw new Error('Season ID is required');

      const { data, error } = await supabase
        .from('submissions')
        .select('provider_track_id')
        .eq('season_id', seasonId)
        .eq('provider_type', 'audius')
        .eq('is_visible', true);

      if (error) throw error;

      // Return Set of track IDs for fast lookup
      return new Set(data?.map(s => s.provider_track_id).filter(Boolean) || []);
    },
    enabled: !!seasonId,
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * Check if a specific Audius track has been submitted to a room
 */
export const useIsTrackSubmittedToRoom = (
  roomId: string | undefined,
  audiusTrackId: string | undefined
) => {
  return useQuery({
    queryKey: ['track-submitted-check', roomId, audiusTrackId],
    queryFn: async () => {
      if (!roomId || !audiusTrackId) return false;

      const { data, error } = await supabase
        .from('submissions')
        .select('id')
        .eq('room_id', roomId)
        .eq('provider_track_id', audiusTrackId)
        .eq('provider_type', 'audius')
        .eq('is_visible', true)
        .maybeSingle();

      if (error) throw error;

      return !!data;
    },
    enabled: !!roomId && !!audiusTrackId,
  });
};

/**
 * Filter user's Audius tracks to show only those not yet submitted to a room
 * Returns tracks with submission status
 */
export const useFilterAvailableTracksForRoom = (
  roomId: string | undefined,
  audiusTracks: AudiusTrack[] | undefined
) => {
  const { data: submittedTrackIds, isLoading } = useRoomSubmittedTracks(roomId);

  return useQuery({
    queryKey: ['available-tracks-for-room', roomId, audiusTracks?.length],
    queryFn: async () => {
      if (!audiusTracks || !submittedTrackIds) return [];

      // Add submission status to each track
      const selectableTracks: SelectableAudiusTrack[] = audiusTracks.map(track => ({
        ...track,
        isAlreadySubmitted: submittedTrackIds.has(track.id),
        canSubmit: !submittedTrackIds.has(track.id),
      }));

      return selectableTracks;
    },
    enabled: !!audiusTracks && !!submittedTrackIds && !!roomId,
  });
};

/**
 * Filter user's Audius tracks to show only those not yet submitted to a season
 */
export const useFilterAvailableTracksForSeason = (
  seasonId: string | undefined,
  audiusTracks: AudiusTrack[] | undefined
) => {
  const { data: submittedTrackIds, isLoading } = useSeasonSubmittedTracks(seasonId);

  return useQuery({
    queryKey: ['available-tracks-for-season', seasonId, audiusTracks?.length],
    queryFn: async () => {
      if (!audiusTracks || !submittedTrackIds) return [];

      // Add submission status to each track
      const selectableTracks: SelectableAudiusTrack[] = audiusTracks.map(track => ({
        ...track,
        isAlreadySubmitted: submittedTrackIds.has(track.id),
        canSubmit: !submittedTrackIds.has(track.id),
      }));

      return selectableTracks;
    },
    enabled: !!audiusTracks && !!submittedTrackIds && !!seasonId,
  });
};

/**
 * Get count of available tracks (not yet submitted)
 */
export const useAvailableTrackCount = (
  roomId: string | undefined,
  totalTracks: number
) => {
  const { data: submittedTrackIds } = useRoomSubmittedTracks(roomId);

  if (!submittedTrackIds) return totalTracks;

  return totalTracks - submittedTrackIds.size;
};
