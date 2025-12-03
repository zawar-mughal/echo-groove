const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const isAbsoluteUrl = (value?: string | null) =>
  !!value && /^https?:\/\//i.test(value);

/**
 * Convert a Supabase storage path (e.g. "submission-thumbnails/123.png")
 * into a publicly accessible URL. Falls back to the original value when
 * we cannot build a URL (e.g. missing env configuration).
 */
export const getPublicAssetUrl = (
  path?: string | null
): string | undefined => {
  if (!path) return undefined;
  if (isAbsoluteUrl(path)) return path;
  if (!SUPABASE_URL) return path;

  const normalizedPath = path
    .replace(/^public\//, '')
    .replace(/^\/+/, '');

  return `${SUPABASE_URL}/storage/v1/object/public/${normalizedPath}`;
};
