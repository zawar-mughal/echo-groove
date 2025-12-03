import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, getUserProfile } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  isAuthenticated: boolean;
  user: SupabaseUser | null;
  profile: Profile | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, username: string) => Promise<void>;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getAuthRedirectUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return import.meta.env.VITE_SITE_URL || 'https://echo-beatbattle.vercel.app';
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    profile: null,
    isLoading: true
  });

  useEffect(() => {
    // Check active session - NON-BLOCKING
    const initializeAuth = async () => {
      console.log('🔐 Initializing auth...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔐 Auth session:', session ? 'Logged in' : 'Not logged in');

        // Set auth state immediately without blocking on profile fetch
        setAuthState({
          isAuthenticated: !!session?.user,
          user: session?.user || null,
          profile: null,  // Don't block for profile
          isLoading: false
        });

        // Fetch profile asynchronously after setting initial state
        if (session?.user) {
          getUserProfile(session.user.id)
            .then(profile => {
              setAuthState(prev => ({
                ...prev,
                profile
              }));
            })
            .catch(profileError => {
              console.warn('Profile not found:', profileError);
              // Keep auth state as is, just without profile
            });
        }
      } catch (error) {
        console.error('🔐 Error initializing auth:', error);
        setAuthState({
          isAuthenticated: false,
          user: null,
          profile: null,
          isLoading: false
        });
      }
    };

    console.log('🔐 Starting auth initialization...');
    initializeAuth();

    // Listen for auth changes - NON-BLOCKING
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Set auth state immediately
        setAuthState({
          isAuthenticated: !!session?.user,
          user: session?.user || null,
          profile: null,  // Don't block for profile
          isLoading: false
        });

        // Fetch profile asynchronously
        if (session?.user) {
          getUserProfile(session.user.id)
            .then(profile => {
              setAuthState(prev => ({
                ...prev,
                profile
              }));
            })
            .catch(error => {
              console.error('Error fetching profile:', error);
              // Keep auth state as is, just without profile
            });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, username: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            username,
            display_name: username,
          },
          shouldCreateUser: true,
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });

      if (error) throw error;

      if (data) {
        // The user will be signed in after clicking the magic link
        // The onAuthStateChange listener will handle the session creation
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Sign up failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signIn = async (email: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });

      if (error) throw error;

      // The user will be signed in after clicking the magic link
      // The onAuthStateChange listener will handle the session creation
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('Sign in failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setAuthState({
        isAuthenticated: false,
        user: null,
        profile: null,
        isLoading: false
      });
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!authState.user) throw new Error('No user logged in');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', authState.user.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setAuthState(prev => ({
          ...prev,
          profile: data
        }));
      }
    } catch (error) {
      console.error('Update profile failed:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!authState.user) {
      console.warn('No user to refresh');
      return;
    }

    try {
      const profile = await getUserProfile(authState.user.id);
      setAuthState(prev => ({
        ...prev,
        profile
      }));
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
