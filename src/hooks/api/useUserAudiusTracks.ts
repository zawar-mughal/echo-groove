import { useQuery } from '@tanstack/react-query';
import { withAudiusSdk } from '@/lib/audius';
import type { AudiusTrack } from '@/types/audius';

// Fetch all tracks uploaded by a specific Audius user
export const useUserAudiusTracks = (audiusUserId: string | undefined) => {
  return useQuery({
    queryKey: ['audius-user-tracks', audiusUserId],
    queryFn: async () => {
      if (!audiusUserId) throw new Error('Audius user ID is required');

      try {
        const { data } = await withAudiusSdk((sdk) =>
          sdk.users.getTracksByUser({
            id: audiusUserId,
            limit: 100, // Fetch up to 100 tracks
          })
        );

        return (data || []) as AudiusTrack[];
      } catch (error) {
        console.error('Error fetching user Audius tracks:', error);
        throw error;
      }
    },
    enabled: !!audiusUserId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

// Fetch tracks with pagination support
export const useUserAudiusTracksPaginated = (
  audiusUserId: string | undefined,
  options?: {
    limit?: number;
    offset?: number;
  }
) => {
  const { limit = 20, offset = 0 } = options || {};

  return useQuery({
    queryKey: ['audius-user-tracks-paginated', audiusUserId, limit, offset],
    queryFn: async () => {
      if (!audiusUserId) throw new Error('Audius user ID is required');

      try {
        const { data } = await withAudiusSdk((sdk) =>
          sdk.users.getTracksByUser({
            id: audiusUserId,
            limit,
            offset,
          })
        );

        return (data || []) as AudiusTrack[];
      } catch (error) {
        console.error('Error fetching paginated Audius tracks:', error);
        throw error;
      }
    },
    enabled: !!audiusUserId,
    staleTime: 1000 * 60 * 5,
  });
};

// Fetch single track metadata
export const useAudiusTrack = (trackId: string | undefined) => {
  return useQuery({
    queryKey: ['audius-track', trackId],
    queryFn: async () => {
      if (!trackId) throw new Error('Track ID is required');

      try {
        const { data } = await withAudiusSdk((sdk) =>
          sdk.tracks.getTrack({ trackId })
        );

        return data as AudiusTrack;
      } catch (error) {
        console.error('Error fetching Audius track:', error);
        throw error;
      }
    },
    enabled: !!trackId,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes (track metadata doesn't change often)
  });
};

// Fetch multiple tracks at once
export const useAudiusTracks = (trackIds: string[] | undefined) => {
  return useQuery({
    queryKey: ['audius-tracks-bulk', trackIds],
    queryFn: async () => {
      if (!trackIds || trackIds.length === 0) throw new Error('Track IDs are required');

      try {
        const { data } = await withAudiusSdk((sdk) =>
          sdk.tracks.getBulkTracks({ id: trackIds })
        );

        return (data || []) as AudiusTrack[];
      } catch (error) {
        console.error('Error fetching bulk Audius tracks:', error);
        throw error;
      }
    },
    enabled: !!trackIds && trackIds.length > 0,
    staleTime: 1000 * 60 * 10,
  });
};
