export const isInDiscordApp = () => {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('discord') ||
      window.location.hostname.includes('discordapp'))
  );
};

export const getDiscordProxiedUrl = (url?: string, isPreSignedUrl = false) => {
  if (!url) return null;

  if (!isInDiscordApp()) return url;

  // Robustly separate params from the URL using indexOf to avoid splitting on multiple '?'
  const queryIndex = url.indexOf('?');
  let cleanUrl = url;
  let originalParams = '';

  if (queryIndex !== -1) {
    cleanUrl = url.substring(0, queryIndex);
    originalParams = url.substring(queryIndex + 1);
  }

  if (!cleanUrl) return null;

  // The proxy endpoint
  const baseProxyUrl = `/.proxy/api/proxy?url=${encodeURIComponent(cleanUrl)}`;

  return originalParams
    ? `${baseProxyUrl}&originalParams=${encodeURIComponent(originalParams)}${isPreSignedUrl ? '&decodeParams=false' : ''
    }`
    : baseProxyUrl;
};

export const getProxiedAssetUrl = (path: string) => {
  // In Discord Embedded Apps, relative paths like '/assets/img.png' work natively 
  // because the discord iframe acts as a tunnel to the mapped domain.
  // We do NOT need to prefix with /.proxy unless we are routing through the API proxy.
  return path;
};

export const getDiscordProxiedUrlSession = (path: string) => {
  if (!isInDiscordApp()) return path;

  // window.location.origin in Discord is 'https://*.discordsays.com', not our backend.
  // We need to target our actual deployed backend URL for session/auth endpoints if we want to proxy them.
  const siteUrl = import.meta.env.VITE_SITE_URL || '';

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${siteUrl}${normalizedPath}`;

  return `/.proxy/api/proxy?url=${encodeURIComponent(fullUrl)}`;
};
