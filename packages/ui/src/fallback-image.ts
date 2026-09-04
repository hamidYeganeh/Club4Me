/** Public path served from each app's `public/fallback.jpg`. */
export const FALLBACK_IMAGE_SRC = "/fallback.jpg";

export function resolveImageSrc(src?: string | null): string {
  const value = src?.trim();
  return value ? value : FALLBACK_IMAGE_SRC;
}
