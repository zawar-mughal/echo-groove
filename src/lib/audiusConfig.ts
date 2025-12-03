import { supabase } from '@/lib/supabase';

export interface AudiusClientConfig {
  apiKey: string;
  appName: string;
}

let configPromise: Promise<AudiusClientConfig> | null = null;

const getEnvFallbackConfig = (): AudiusClientConfig | null => {
  const apiKey = import.meta.env.VITE_AUDIUS_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    appName: import.meta.env.VITE_AUDIUS_APP_NAME || 'Echo Groove Battle',
  };
};

const resolveFromEnv = (): Promise<AudiusClientConfig> => {
  const fallback = getEnvFallbackConfig();
  if (!fallback) {
    return Promise.reject(new Error('Audius API key not configured in environment variables.'));
  }
  return Promise.resolve(fallback);
};

export const getAudiusClientConfig = (): Promise<AudiusClientConfig> => {
  if (configPromise) {
    return configPromise;
  }

  // During local development we rely on .env to avoid CORS issues with remote edge functions.
  if (import.meta.env.DEV) {
    configPromise = resolveFromEnv();
    return configPromise;
  }

  configPromise = (async () => {
    const fallback = getEnvFallbackConfig();

    try {
      const { data, error } = await supabase.functions.invoke<{
        apiKey?: string;
        appName?: string;
        error?: string;
      }>('audius-config', {
        method: 'GET',
      });

      if (error) {
        throw error;
      }

      if (!data?.apiKey) {
        throw new Error('Audius API key missing from config response');
      }

      return {
        apiKey: data.apiKey,
        appName: data.appName || 'Echo Groove Battle',
      };
    } catch (err) {
      console.error('Failed to fetch Audius config from Supabase. Falling back to env variables if available.', err);
      if (fallback) {
        return fallback;
      }
      throw err;
    }
  })();

  return configPromise;
};
