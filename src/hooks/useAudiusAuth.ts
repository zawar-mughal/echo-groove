import { useState, useCallback, useRef } from 'react';
import { initializeAudiusOAuth, loginWithAudius, checkAudiusWriteAccess } from '@/lib/audius';
import type { AudiusOAuthCallbackUser } from '@/types/audius';

export type AudiusAuthIntent = 'authenticate' | 'link';

export interface AudiusAuthState {
  isInitialized: boolean;
  user: AudiusOAuthCallbackUser | null;
  jwt: string | null;
  error: Error | null;
  intent: AudiusAuthIntent | null;
}

export const useAudiusAuth = () => {
  const [authState, setAuthState] = useState<AudiusAuthState>(() => {
    const storedJwt = localStorage.getItem('audiusJWT');
    const storedUser = localStorage.getItem('audiusUser');
    const storedIsInitialized = localStorage.getItem('audiusIsInitialized');
    return {
      isInitialized: storedIsInitialized ? JSON.parse(storedIsInitialized) : false,
      user: storedUser ? JSON.parse(storedUser) : null,
      jwt: storedJwt,
      error: null,
      intent: null,
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const isOAuthReady = useRef(false);
  const isInitializing = useRef(false);
  const authIntent = useRef<AudiusAuthIntent | null>(null);

  // Don't initialize OAuth on mount - only when user actually tries to log in
  // This prevents the Audius SDK from being loaded unnecessarily
  const initializeOAuth = useCallback(async () => {
    // If OAuth is already ready or currently initializing, skip
    if (isOAuthReady.current || isInitializing.current) {
      console.log('🎵 OAuth already ready or initializing, skipping...');
      return;
    }

    if (authState.isInitialized && isOAuthReady.current) {
      console.log('🎵 OAuth already initialized and ready');
      return;
    }

    isInitializing.current = true;
    console.log('🎵 Initializing Audius OAuth...');

    try {
      await initializeAudiusOAuth({
        successCallback: (user, encodedJWT) => {
          console.log('Audius OAuth success:', user);
          localStorage.setItem('audiusJWT', encodedJWT);
          localStorage.setItem('audiusUser', JSON.stringify(user));
          localStorage.setItem('audiusIsInitialized', JSON.stringify(true));
          setAuthState({
            isInitialized: true,
            user: user as AudiusOAuthCallbackUser,
            jwt: encodedJWT,
            error: null,
            intent: authIntent.current,
          });
          setIsLoading(false);
        },
        errorCallback: (error) => {
          console.error('Audius OAuth error:', error);
          authIntent.current = null; // Clear intent on error
          setAuthState({
            isInitialized: true,
            user: null,
            jwt: null,
            error: new Error(error),
            intent: null,
          });
          setIsLoading(false);
        },
      });

      // CRITICAL: Add delay to allow SDK to process the init() call asynchronously
      // The Audius SDK's oauth.init() is synchronous but processes callbacks async
      // Without this delay, login() will be called before callbacks are registered
      console.log('🎵 Waiting for SDK to process init...');
      await new Promise(resolve => setTimeout(resolve, 150));

      isOAuthReady.current = true;
      console.log('🎵 OAuth ready for login');
    } catch (error) {
      console.error('Failed to initialize Audius OAuth:', error);
      authIntent.current = null; // Clear intent on error
      setAuthState({
        isInitialized: true,
        user: null,
        jwt: null,
        error: error instanceof Error ? error : new Error('Failed to initialize Audius OAuth'),
        intent: null,
      });
      setIsLoading(false);
    } finally {
      isInitializing.current = false;
    }
  }, [authState.isInitialized]);

  // Trigger login with Audius
  const login = useCallback(async (
    scope: 'read' | 'write' = 'write',
    intent: AudiusAuthIntent = 'authenticate'
  ) => {
    // Store intent for callback
    authIntent.current = intent;
    console.log('🎵 Starting Audius OAuth with intent:', intent);

    await initializeOAuth(); // Initialize OAuth before login

    // Verify OAuth is ready before attempting login
    if (!isOAuthReady.current) {
      const error = new Error('OAuth not ready - initialization may have failed');
      console.error('❌ Cannot login:', error.message);
      setAuthState(prev => ({ ...prev, error }));
      return;
    }

    setIsLoading(true);
    setAuthState(prev => ({ ...prev, error: null }));
    try {
      console.log('🎵 Triggering Audius login with scope:', scope);
      await loginWithAudius(scope);
    } catch (error) {
      console.error('Failed to start Audius login:', error);
      setIsLoading(false);
      authIntent.current = null; // Clear intent on error
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to start Audius login'),
      }));
    }
  }, [initializeOAuth]);

  // Clear auth state (logout)
  const logout = useCallback(() => {
    localStorage.removeItem('audiusJWT');
    localStorage.removeItem('audiusUser');
    localStorage.removeItem('audiusIsInitialized');
    setAuthState({
      isInitialized: false,
      user: null,
      jwt: null,
      error: null,
      intent: null,
    });
    isOAuthReady.current = false;
    isInitializing.current = false;
    authIntent.current = null;
  }, []);

  // Check if user has write access
  const hasWriteAccess = useCallback(async (userId: string): Promise<boolean> => {
    try {
      return await checkAudiusWriteAccess(userId);
    } catch (error) {
      console.error('Error checking write access:', error);
      return false;
    }
  }, []);

  return {
    ...authState,
    isLoading,
    login,
    logout,
    hasWriteAccess,
  };
};
