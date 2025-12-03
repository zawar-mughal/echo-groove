import { sdk } from '@audius/sdk';
import Web3 from 'web3';
import { getAudiusClientConfig } from '@/lib/audiusConfig';
import type { AudiusOAuthCallbackUser } from '@/types/audius';

declare global {
  interface Window {
    Web3?: typeof Web3;
  }
}

// Required for Audius SDK in browser environment
// NOTE: This may generate a console warning: "Method 'personal_sign' not implemented on local transport"
// This warning is expected and harmless - it comes from the Audius SDK's internal Web3 setup
// and does NOT block the OAuth authentication flow. Users can successfully authenticate despite this warning.
if (typeof window !== 'undefined') {
  window.Web3 = Web3;

  // Suppress the harmless "personal_sign not implemented" warning from Web3.js
  const originalWarn = console.warn;
  console.warn = function(...args: any[]) {
    const message = args[0];
    if (typeof message === 'string' && message.includes("Method 'personal_sign' not implemented")) {
      // Silently ignore this specific warning
      return;
    }
    originalWarn.apply(console, args);
  };
}

type AudiusSdkInstance = ReturnType<typeof sdk>;

let audiusSdkPromise: Promise<AudiusSdkInstance> | null = null;

const loadAudiusSdk = () => {
  if (!audiusSdkPromise) {
    audiusSdkPromise = (async () => {
      const config = await getAudiusClientConfig();
      console.log('🎵 Initializing Audius SDK (lazy)...');
      return sdk({
        apiKey: config.apiKey,
        appName: config.appName,
      });
    })();
  }

  return audiusSdkPromise;
};

export const getAudiusSdk = (): Promise<AudiusSdkInstance> => loadAudiusSdk();

export const withAudiusSdk = async <T>(
  handler: (instance: AudiusSdkInstance) => Promise<T> | T
): Promise<T> => {
  const instance = await loadAudiusSdk();
  return handler(instance);
};

// Export OAuth initialization function
export const initializeAudiusOAuth = async (config: {
  successCallback: (user: AudiusOAuthCallbackUser, encodedJWT: string) => void;
  errorCallback: (error: string) => void;
}) => {
  const instance = await loadAudiusSdk();
  instance.oauth.init({
    successCallback: config.successCallback,
    errorCallback: config.errorCallback,
  });
};

// Export OAuth login trigger
export const loginWithAudius = async (scope: 'read' | 'write' = 'write') => {
  const instance = await loadAudiusSdk();
  instance.oauth.login({ scope });
};

// Check if user has granted write access
export const checkAudiusWriteAccess = async (userId: string): Promise<boolean> => {
  try {
    const instance = await loadAudiusSdk();
    const hasAccess = await instance.oauth.isWriteAccessGranted({ userId });
    return hasAccess;
  } catch (error) {
    console.error('Error checking Audius write access:', error);
    return false;
  }
};
