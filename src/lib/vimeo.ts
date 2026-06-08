const VIMEO_REGEX = /vimeo\.com\/(?:video\/)?(\d+)/;

export function isValidVimeoUrl(url: string): boolean {
  if (!url) return false;
  return VIMEO_REGEX.test(url);
}
