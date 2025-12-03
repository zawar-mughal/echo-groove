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

  // Separate params from the URL
  const [cleanUrl, originalParams = ''] = url.split('?');

  if (!cleanUrl) return null;

  const baseProxyUrl = `/.proxy/api/proxy?url=${encodeURIComponent(cleanUrl)}`;

  return originalParams
    ? `${baseProxyUrl}&originalParams=${encodeURIComponent(originalParams)}${
        isPreSignedUrl ? '&decodeParams=false' : ''
      }`
    : baseProxyUrl;
};

export const getProxiedAssetUrl = (path: string) => {
  return isInDiscordApp() ? `/.proxy${path}` : path;
};

export const getDiscordProxiedUrlSession = (url: string) => {
  if (!isInDiscordApp()) return url;

  return `/.proxy/api/proxy?url=${encodeURIComponent(window.location.origin + url)}`;
};
