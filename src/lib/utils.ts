import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format phone number as (XXX) XXX-XXXX for display
 * Strips all non-digits and formats as user types
 */
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Strip phone number to digits only for database storage
 */
export function stripPhoneNumber(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

/**
 * Convert a string to a URL-friendly slug
 * @param text - Text to slugify
 * @returns URL-safe lowercase slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars (except spaces and hyphens)
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ""); // Trim hyphens from start/end
}

/**
 * Generate a merchant page slug from business name and ID
 * @param businessName - Business name
 * @param id - Merchant UUID
 * @returns SEO-friendly slug (e.g., "cobblestone-auto-spa-abc12345")
 */
export function generateMerchantSlug(businessName: string, id: string): string {
  const nameSlug = slugify(businessName);
  const shortId = id.slice(0, 8); // First 8 chars of UUID
  return `${nameSlug}-${shortId}`;
}

/**
 * Generate the full merchant page URL path
 * @param city - City name
 * @param state - State code (2 letters)
 * @param slug - Merchant slug
 * @returns Full URL path (e.g., "/business/denver/co/cobblestone-auto-spa-abc12345")
 */
export function getMerchantPageUrl(city: string, state: string, slug: string): string {
  const citySlug = slugify(city);
  const stateSlug = state.toLowerCase();
  return `/business/${citySlug}/${stateSlug}/${slug}`;
}

/**
 * Generate the short URL path for a merchant (phone number based)
 * @param phone - Phone number (will be stripped to digits)
 * @returns Short URL path (e.g., "/4255779060")
 */
export function getMerchantShortUrl(phone: string): string {
  return `/${stripPhoneNumber(phone)}`;
}

/**
 * Format hours value for display
 * Handles stored formats: "HH:MM-HH:MM", "Closed", "24 Hours", or legacy "H:MM AM - H:MM PM"
 * @param value - Hours string from database
 * @returns Formatted display string (e.g., "9:00 AM - 5:00 PM")
 */
export function formatHoursDisplay(value: string | undefined): string {
  if (!value || value.toLowerCase() === "closed") return "Closed";
  if (value.toLowerCase() === "24 hours") return "24 Hours";

  // Check if already in display format (legacy)
  if (value.includes("AM") || value.includes("PM")) return value;

  // Parse "HH:MM-HH:MM" format
  const match = value.match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
  if (match) {
    const formatTime = (h: number, m: number) => {
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? "AM" : "PM";
      return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
    };

    const openH = parseInt(match[1]);
    const openM = parseInt(match[2]);
    const closeH = parseInt(match[3]);
    const closeM = parseInt(match[4]);

    if (openH === 0 && openM === 0 && closeH === 23 && closeM === 59) {
      return "24 Hours";
    }

    return `${formatTime(openH, openM)} - ${formatTime(closeH, closeM)}`;
  }

  // Return as-is if can't parse
  return value;
}
