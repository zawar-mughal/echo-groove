import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { withAudiusSdk } from '@/lib/audius';
import { supabase } from '@/lib/supabase';
import type { AudiusUserProfile } from '@/types/audius';

/**
 * Fetch Audius profile by user ID
 */
export const useAudiusProfile = (audiusUserId: string | undefined) => {
  return useQuery({
    queryKey: ['audius-profile', audiusUserId],
    queryFn: async () => {
      if (!audiusUserId) throw new Error('Audius user ID is required');

      try {
        const { data } = await withAudiusSdk((sdk) =>
          sdk.users.getUser({ id: audiusUserId })
        );

        return data as AudiusUserProfile;
      } catch (error) {
        console.error('Error fetching Audius profile:', error);
        throw error;
      }
    },
    enabled: !!audiusUserId,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
};

/**
 * Sync Audius profile data to Echo database
 */
export const useSyncAudiusProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      echoUserId: string;
      audiusUserId: string;
    }) => {
      const { echoUserId, audiusUserId } = params;

      // Fetch latest Audius profile
      const { data: audiusProfile } = await withAudiusSdk((sdk) =>
        sdk.users.getUser({ id: audiusUserId })
      );

      if (!audiusProfile) {
        throw new Error('Audius profile not found');
      }

      // Update Echo profile
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: audiusProfile.name,
          bio: audiusProfile.bio || null,
          avatar_url: audiusProfile.profilePicture?._480x480 || null,
          audius_handle: audiusProfile.handle,
          updated_at: new Date().toISOString(),
        })
        .eq('id', echoUserId);

      if (error) throw error;

      return audiusProfile;
    },
    onSuccess: (_data, variables) => {
      // Invalidate Echo user profile cache
      queryClient.invalidateQueries({ queryKey: ['user-profile', variables.echoUserId] });
    },
  });
};
