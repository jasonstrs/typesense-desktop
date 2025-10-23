/**
 * Utility functions for detecting and handling image URLs
 */

/**
 * Check if a string is a valid image URL
 */
export function isImageUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  // Check if it looks like a URL
  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    return false;
  }

  // Check if it ends with common image extensions
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i.test(value);
}
