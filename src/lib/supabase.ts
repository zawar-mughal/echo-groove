import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { isInDiscordApp } from '@/utils/discord-proxy';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

// Use proxied URL when in Discord
const getSupabaseUrl = () => {
  if (isInDiscordApp()) {
    // Replace the Supabase URL with the proxied version
    const url = new URL(supabaseUrl);
    return `${window.location.origin}/supabase-api${url.pathname}`;
  }
  return supabaseUrl;
};

export const supabase = createClient<Database>(getSupabaseUrl(), supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  // Realtime disabled - not needed for MVP
});

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper to get user profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

// Helper to check if user is admin
export const isUserAdmin = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data?.is_admin || false;
};
