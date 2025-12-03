import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { useAudiusAuth, type AudiusAuthIntent } from '@/hooks/useAudiusAuth';
import type { AudiusOAuthCallbackUser } from '@/types/audius';
import { toast } from 'sonner';

const MAGIC_LINK_STORAGE_KEY = 'echo-audius-link';
const MAGIC_LINK_EXPIRATION_MS = 1000 * 60 * 10; // 10 minutes

interface StoredLinkState {
  email: string;
  timestamp: number;
  audiusData?: {
    user: AudiusOAuthCallbackUser;
    jwt: string;
    intent?: AudiusAuthIntent | null;
  };
}

const getStoredLinkState = (): StoredLinkState | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(MAGIC_LINK_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredLinkState;
    if (!parsed?.email) return null;
    if (
      typeof parsed.timestamp === 'number' &&
      Date.now() - parsed.timestamp > MAGIC_LINK_EXPIRATION_MS
    ) {
      window.localStorage.removeItem(MAGIC_LINK_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn('Failed to parse stored Audius magic-link state', error);
    window.localStorage.removeItem(MAGIC_LINK_STORAGE_KEY);
    return null;
  }
};

interface AudiusAuthContextType {
  audiusUser: AudiusOAuthCallbackUser | null;
  audiusJWT: string | null;
  isAudiusLinked: boolean;
  isLoading: boolean;
  error: Error | null;
  isLinkSent: boolean;
  audiusEmail: string | null;
  linkAudiusAccount: () => void;
  loginWithAudius: () => Promise<void>;
  unlinkAudiusAccount: () => Promise<void>;
  resetLinkSent: () => void;
}

const AudiusAuthContext = createContext<AudiusAuthContextType | undefined>(undefined);

export const AudiusAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { profile: echoProfile, refreshUser, user: echoUser } = useAuth();
  const { user: audiusUser, jwt: audiusJWT, intent: audiusIntent, isLoading: audiusLoading, login, logout, error } = useAudiusAuth();
  const [isAudiusLinked, setIsAudiusLinked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [initialLinkState] = useState<StoredLinkState | null>(() => getStoredLinkState());
  const [isLinkSent, setIsLinkSent] = useState(Boolean(initialLinkState));
  const [audiusEmail, setAudiusEmail] = useState<string | null>(initialLinkState?.email ?? null);
  const processedAudiusUserRef = useRef<string | null>(null);
  const pendingLinkRef = useRef(false);

  const persistLinkSentState = useCallback((email: string, audiusData?: StoredLinkState['audiusData']) => {
    setIsLinkSent(true);
    setAudiusEmail(email);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        MAGIC_LINK_STORAGE_KEY,
        JSON.stringify({ email, timestamp: Date.now(), audiusData })
      );
    }
  }, []);

  const clearLinkSentState = useCallback(() => {
    setIsLinkSent(false);
    setAudiusEmail(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(MAGIC_LINK_STORAGE_KEY);
    }
  }, []);

  // Check if current user has Audius linked
  useEffect(() => {
    if (echoProfile) {
      setIsAudiusLinked(Boolean(echoProfile.audius_id));
    } else {
      setIsAudiusLinked(false);
    }
  }, [echoProfile]);

  const linkAccount = useCallback(async (audiusUserData: AudiusOAuthCallbackUser, jwt: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const targetUserId = echoProfile?.id || sessionData?.session?.user?.id;

      if (!targetUserId) {
        console.error('No Echo user session available to link Audius account');
        toast.error('You must be logged in to link your Audius account');
        return;
      }

      // Verify email matches
      const echoEmail = echoUser?.email;
      if (echoEmail && audiusUserData.email?.toLowerCase() !== echoEmail.toLowerCase()) {
        console.error('Email mismatch:', { echoEmail, audiusEmail: audiusUserData.email });
        toast.error('Audius account email must match your Echo account email');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          audius_id: audiusUserData.userId,
          audius_handle: audiusUserData.handle,
          audius_jwt: jwt,
          display_name: echoProfile?.display_name || audiusUserData.name,
          avatar_url: echoProfile?.avatar_url || audiusUserData.profilePicture?._480x480,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId);

      if (error) throw error;

      await refreshUser();
      clearLinkSentState();
      console.log('Successfully linked Audius account');
      toast.success('Audius account connected');
    } catch (err) {
      console.error('Error linking Audius account:', err);
      toast.error('Failed to link Audius account');
      throw err;
    }
  }, [clearLinkSentState, echoProfile, echoUser, refreshUser]);

  // After a magic-link authentication completes, ensure we link the Audius account.
  useEffect(() => {
    if (!echoUser || !echoProfile) return;
    const stored = getStoredLinkState();
    if (!stored?.audiusData) return;

    // Already linked? clear stale state and exit.
    if (echoProfile.audius_id) {
      clearLinkSentState();
      return;
    }

    const { user: storedAudiusUser, jwt } = stored.audiusData;
    if (!storedAudiusUser || !jwt) {
      clearLinkSentState();
      return;
    }

    if (pendingLinkRef.current) return;
    pendingLinkRef.current = true;
    linkAccount(storedAudiusUser, jwt)
      .catch((err) => {
        console.error('Failed to link Audius account after magic link login:', err);
      })
      .finally(() => {
        pendingLinkRef.current = false;
      });
  }, [clearLinkSentState, echoProfile, echoUser, linkAccount]);

  const createOrLoginWithAudius = useCallback(async (
    audiusUserData: AudiusOAuthCallbackUser,
    jwt: string
  ) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        console.log('Existing Echo session detected during Audius auth, linking account.');
        await linkAccount(audiusUserData, jwt);
        return;
      }

      // Check if user already exists with this Audius ID
      console.log('🔍 Checking for existing Audius profile:', audiusUserData.userId);
      const { data: existingProfiles, error: fetchError } = await supabase
        .from('profiles')
        .select('id,username,audius_id')
        .eq('audius_id', audiusUserData.userId)
        .maybeSingle();

      // Log the query result
      console.log('📊 Profile query result:', { existingProfiles, fetchError });

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No profile found - this is expected, continue with account creation
          console.log('ℹ️ No existing profile found for this Audius ID');
        } else {
          // Other error - log but don't block
          console.error('❌ Error fetching existing profile:', fetchError);
        }
      }

      const existingProfile = existingProfiles;

      if (existingProfile) {
        if (!isLinkSent) {
          await supabase.auth.signInWithOtp({
            email: audiusUserData.email,
          });
        } else {
          console.log('Magic link already sent, skipping duplicate email');
        }
      } else {
        // Create new Echo account with Audius data
        const { error: signUpError } = await supabase.auth.signInWithOtp({
          email: audiusUserData.email,
          options: {
            data: {
              username: audiusUserData.handle,
              audius_id: audiusUserData.userId,
              audius_handle: audiusUserData.handle,
              display_name: audiusUserData.name,
              avatar_url: audiusUserData.profilePicture?._480x480,
            },
            shouldCreateUser: true,
          },
        });

        if (signUpError) throw signUpError;

        console.log('Successfully created Echo account from Audius');
      }
    } catch (err) {
      console.error('Error creating/logging in with Audius:', err);
      throw err;
    }
  }, [isLinkSent, linkAccount, persistLinkSentState]);

  const handleAudiusAuthSuccess = useCallback(async (
    audiusUserData: AudiusOAuthCallbackUser,
    jwt: string,
    intent: AudiusAuthIntent | null
  ) => {
    setIsProcessing(true);
    setAudiusEmail(audiusUserData.email);

    try {
      console.log('🎯 Handling Audius auth success with intent:', intent);

      // Intent takes precedence over echoUser state
      if (intent === 'link') {
        // User wants to link account - must be logged in
        if (!echoUser) {
          console.error('Cannot link without Echo session');
          toast.error('You must be logged into Echo to link your Audius account');
          return;
        }
        await linkAccount(audiusUserData, jwt);
      } else if (intent === 'authenticate') {
        persistLinkSentState(audiusUserData.email, {
          user: audiusUserData,
          jwt,
          intent,
        });
        // User wants to login/create account - send magic link
        await createOrLoginWithAudius(audiusUserData, jwt);
      } else {
        // Fallback to old behavior if no intent (shouldn't happen)
        console.warn('⚠️ No intent provided, falling back to echoUser check');
        if (echoUser) {
          await linkAccount(audiusUserData, jwt);
        } else {
          await createOrLoginWithAudius(audiusUserData, jwt);
        }
      }
    } catch (err) {
      console.error('Error handling Audius auth:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [createOrLoginWithAudius, echoUser, linkAccount]);

  // Handle Audius OAuth success - link or create account
  useEffect(() => {
    if (!audiusUser || !audiusJWT) {
      processedAudiusUserRef.current = null;
      return;
    }

    if (isProcessing) return;
    if (processedAudiusUserRef.current === audiusUser.userId) return;

    processedAudiusUserRef.current = audiusUser.userId;

    handleAudiusAuthSuccess(audiusUser, audiusJWT, audiusIntent).catch(() => {
      processedAudiusUserRef.current = null;
    });
  }, [audiusIntent, audiusJWT, audiusUser, handleAudiusAuthSuccess, isProcessing]);

  const linkAudiusAccount = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user && !echoUser) {
      console.error('Must be logged in to Echo to link Audius account');
      toast.error('You must be logged into Echo to link your Audius account');
      return;
    }
    await login('write', 'link');
  };

  const loginWithAudius = () => login('write', 'authenticate');

  const unlinkAudiusAccount = async () => {
    if (!echoProfile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          audius_id: null,
          audius_handle: null,
          audius_jwt: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', echoProfile.id);

      if (error) throw error;

      clearLinkSentState();
      // Clear Audius auth state
      logout();

      // Refresh user data
      await refreshUser();

      console.log('Successfully unlinked Audius account');
    } catch (err) {
      console.error('Error unlinking Audius account:', err);
      throw err;
    }
  };

  const resetLinkSent = () => {
    clearLinkSentState();
  };

  const value = {
    audiusUser,
    audiusJWT,
    isAudiusLinked,
    isLoading: audiusLoading || isProcessing,
    error,
    isLinkSent,
    audiusEmail,
    linkAudiusAccount,
    loginWithAudius,
    unlinkAudiusAccount,
    resetLinkSent,
  };

  return (
    <AudiusAuthContext.Provider value={value}>
      {children}
    </AudiusAuthContext.Provider>
  );
};

export const useAudiusAuthContext = () => {
  const context = useContext(AudiusAuthContext);
  if (context === undefined) {
    throw new Error('useAudiusAuthContext must be used within an AudiusAuthProvider');
  }
  return context;
};
