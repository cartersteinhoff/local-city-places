"use client";

/**
 * Google Maps Embed Component
 *
 * Displays an embedded Google Map for a business location.
 * Uses either the Google Place ID (most accurate) or falls back to address query.
 *
 * Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.
 *
 * Map styles use CSS filters to match different design themes:
 * - default: Standard Google Maps
 * - dark: Inverted colors for dark themes (Art Deco, Noir Luxe)
 * - grayscale: Black & white for minimal themes
 * - warm: Sepia tint for warm/friendly themes
 * - cool: Blue tint for tech/professional themes
 */

type MapStyle = "default" | "dark" | "grayscale" | "warm" | "cool";

const mapStyleFilters: Record<MapStyle, string> = {
  default: "",
  dark: "invert(90%) hue-rotate(180deg) brightness(0.9) contrast(1.1)",
  grayscale: "grayscale(100%) contrast(1.1)",
  warm: "sepia(30%) saturate(1.1) brightness(1.05)",
  cool: "saturate(0.8) hue-rotate(10deg) brightness(1.05)",
};

interface GoogleMapEmbedProps {
  businessName: string;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  googlePlaceId?: string | null;
  className?: string;
  height?: string;
  mapStyle?: MapStyle;
}

export function GoogleMapEmbed({
  businessName,
  streetAddress,
  city,
  state,
  zipCode,
  googlePlaceId,
  className = "",
  height = "300px",
  mapStyle = "default",
}: GoogleMapEmbedProps) {
  // Use the same API key as Google Places - just needs Maps Embed API enabled
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

  // If no API key, don't render
  if (!apiKey) {
    return null;
  }

  // Build the embed URL
  let embedUrl: string;

  if (googlePlaceId) {
    // Use Place ID for most accurate result
    embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${googlePlaceId}`;
  } else {
    // Fall back to address query
    const addressParts = [streetAddress, city, state, zipCode].filter(Boolean);
    const query = addressParts.length > 0
      ? `${businessName}, ${addressParts.join(", ")}`
      : businessName;
    embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(query)}`;
  }

  const filterStyle = mapStyleFilters[mapStyle];

  return (
    <div className={`overflow-hidden ${className}`} style={{ height }}>
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        style={{ border: 0, filter: filterStyle || undefined }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Map showing ${businessName}`}
      />
    </div>
  );
}

/**
 * Helper to build a Google Maps directions URL
 */
export function getGoogleMapsDirectionsUrl(
  businessName: string,
  streetAddress?: string | null,
  city?: string | null,
  state?: string | null,
  zipCode?: string | null,
  googlePlaceId?: string | null
): string {
  if (googlePlaceId) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(businessName)}&destination_place_id=${googlePlaceId}`;
  }

  const addressParts = [streetAddress, city, state, zipCode].filter(Boolean);
  const query = addressParts.length > 0
    ? `${businessName}, ${addressParts.join(", ")}`
    : businessName;

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

/**
 * Helper to format a full address string
 */
export function formatFullAddress(
  streetAddress?: string | null,
  city?: string | null,
  state?: string | null,
  zipCode?: string | null
): string | null {
  const line1 = streetAddress;
  const line2Parts = [city, state].filter(Boolean);
  const line2 = line2Parts.length > 0 ? line2Parts.join(", ") : null;
  const line2WithZip = line2 && zipCode ? `${line2} ${zipCode}` : line2;

  if (line1 && line2WithZip) {
    return `${line1}, ${line2WithZip}`;
  }
  return line1 || line2WithZip || null;
}
