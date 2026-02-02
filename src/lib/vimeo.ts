/**
 * Vimeo URL parsing utilities
 */

// Regex to extract video ID from various Vimeo URL formats
// Matches: vimeo.com/123456789, player.vimeo.com/video/123456789
const VIMEO_REGEX = /vimeo\.com\/(?:video\/)?(\d+)/;

/**
 * Extract video ID from a Vimeo URL
 * @param url - Full Vimeo URL (e.g., "https://vimeo.com/1160781582")
 * @returns Video ID string or null if invalid
 */
export function extractVimeoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(VIMEO_REGEX);
  return match ? match[1] : null;
}

/**
 * Check if a URL is a valid Vimeo URL
 * @param url - URL to validate
 * @returns true if valid Vimeo URL
 */
export function isValidVimeoUrl(url: string): boolean {
  if (!url) return false;
  return VIMEO_REGEX.test(url);
}

/**
 * Get the embed URL for a Vimeo video
 * @param videoId - Vimeo video ID
 * @returns Player embed URL
 */
export function getVimeoEmbedUrl(videoId: string): string {
  return `https://player.vimeo.com/video/${videoId}`;
}

/**
 * Convert any Vimeo URL to embed URL
 * @param url - Full Vimeo URL
 * @returns Player embed URL or null if invalid
 */
export function vimeoUrlToEmbed(url: string): string | null {
  const videoId = extractVimeoId(url);
  return videoId ? getVimeoEmbedUrl(videoId) : null;
}
