/**
 * Populate merchant data from Google Places API (New).
 * Fetches: hours, description, phone, website, Google rating/review count.
 * Only updates fields that are currently empty on each merchant.
 *
 * Usage: npx tsx scripts/populate-from-google.ts
 *
 * Processes in batches with delay to stay under API rate limits.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) throw new Error("DATABASE_URL not set");

// Use a server-side key (no browser referrer restrictions)
const API_KEY = process.env.GOOGLE_PLACES_SERVER_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
if (!API_KEY) throw new Error("GOOGLE_PLACES_SERVER_KEY or NEXT_PUBLIC_GOOGLE_PLACES_API_KEY not set");

const db = postgres(DB_URL);

const BATCH_SIZE = 10;
const DELAY_MS = 200; // delay between batches to avoid rate limits

const FIELDS = [
  "regularOpeningHours",
  "editorialSummary",
  "nationalPhoneNumber",
  "websiteUri",
  "rating",
  "userRatingCount",
].join(",");

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const DAY_MAP: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

function formatTime(hour: number, minute: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

function parseHours(
  regularOpeningHours: any
): Record<string, string> | null {
  if (!regularOpeningHours?.periods) return null;

  const hours: Record<string, string> = {};

  // Check for 24/7 — single period with no close
  if (
    regularOpeningHours.periods.length === 1 &&
    !regularOpeningHours.periods[0].close
  ) {
    for (const day of Object.values(DAY_MAP)) {
      hours[day] = "Open 24 hours";
    }
    return hours;
  }

  // Use weekday_descriptions if available (most readable)
  if (regularOpeningHours.weekdayDescriptions) {
    const dayNames: Record<string, string> = {
      Monday: "monday",
      Tuesday: "tuesday",
      Wednesday: "wednesday",
      Thursday: "thursday",
      Friday: "friday",
      Saturday: "saturday",
      Sunday: "sunday",
    };

    for (const desc of regularOpeningHours.weekdayDescriptions) {
      const colonIdx = desc.indexOf(":");
      if (colonIdx === -1) continue;
      const day = desc.substring(0, colonIdx).trim();
      const time = desc.substring(colonIdx + 1).trim();
      const key = dayNames[day];
      if (key) hours[key] = time;
    }

    if (Object.keys(hours).length > 0) return hours;
  }

  // Fallback to parsing periods
  for (const period of regularOpeningHours.periods) {
    const dayKey = DAY_MAP[period.open?.day];
    if (!dayKey) continue;

    if (!period.close) {
      hours[dayKey] = "Open 24 hours";
    } else {
      const open = formatTime(period.open.hour, period.open.minute || 0);
      const close = formatTime(period.close.hour, period.close.minute || 0);
      // Append if multiple periods for same day (e.g., lunch + dinner)
      hours[dayKey] = hours[dayKey]
        ? `${hours[dayKey]}, ${open} – ${close}`
        : `${open} – ${close}`;
    }
  }

  return Object.keys(hours).length > 0 ? hours : null;
}

function stripPhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(0, 10);
}

async function fetchPlaceDetails(placeId: string) {
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=${FIELDS}&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  API error for ${placeId}: ${res.status}`);
    return null;
  }
  return res.json();
}

async function main() {
  console.log("=".repeat(60));
  console.log("Populate Merchants from Google Places API");
  console.log("=".repeat(60));
  console.log();

  // Add google_rating and google_review_count columns if they don't exist
  await db`
    ALTER TABLE merchants
    ADD COLUMN IF NOT EXISTS google_rating numeric(2,1),
    ADD COLUMN IF NOT EXISTS google_review_count integer
  `;
  console.log("Ensured google_rating and google_review_count columns exist.\n");

  // Get all merchants with a google_place_id
  const merchants = await db`
    SELECT id, business_name, google_place_id, hours, description, phone, website, google_rating, google_review_count
    FROM merchants
    WHERE google_place_id IS NOT NULL AND google_place_id != ''
    ORDER BY business_name
  `;

  console.log(`Found ${merchants.length} merchants with Google Place IDs.\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < merchants.length; i += BATCH_SIZE) {
    const batch = merchants.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (merchant) => {
        try {
          const place = await fetchPlaceDetails(merchant.google_place_id);
          if (!place) {
            failed++;
            return;
          }

          const updates: Record<string, any> = {};

          // Hours — only if merchant doesn't have them
          if (
            !merchant.hours ||
            !Object.values(merchant.hours as Record<string, string>).some(Boolean)
          ) {
            const hours = parseHours(place.regularOpeningHours);
            if (hours) updates.hours = JSON.stringify(hours);
          }

          // Description — only if empty
          if (!merchant.description && place.editorialSummary?.text) {
            updates.description = place.editorialSummary.text;
          }

          // Phone — only if empty
          if (!merchant.phone && place.nationalPhoneNumber) {
            updates.phone = stripPhone(place.nationalPhoneNumber);
          }

          // Website — only if empty
          if (!merchant.website && place.websiteUri) {
            updates.website = place.websiteUri;
          }

          // Google rating — always update (fresh data)
          if (place.rating != null) {
            updates.google_rating = place.rating;
          }

          // Google review count — always update
          if (place.userRatingCount != null) {
            updates.google_review_count = place.userRatingCount;
          }

          if (Object.keys(updates).length === 0) {
            skipped++;
            return;
          }

          // Build dynamic update
          const setClauses = Object.entries(updates)
            .map(([key]) => key)
            .filter(Boolean);

          if (setClauses.length > 0) {
            // Use individual column updates
            if (updates.hours !== undefined)
              await db`UPDATE merchants SET hours = ${updates.hours}::jsonb WHERE id = ${merchant.id}`;
            if (updates.description !== undefined)
              await db`UPDATE merchants SET description = ${updates.description} WHERE id = ${merchant.id}`;
            if (updates.phone !== undefined)
              await db`UPDATE merchants SET phone = ${updates.phone} WHERE id = ${merchant.id}`;
            if (updates.website !== undefined)
              await db`UPDATE merchants SET website = ${updates.website} WHERE id = ${merchant.id}`;
            if (updates.google_rating !== undefined)
              await db`UPDATE merchants SET google_rating = ${updates.google_rating} WHERE id = ${merchant.id}`;
            if (updates.google_review_count !== undefined)
              await db`UPDATE merchants SET google_review_count = ${updates.google_review_count} WHERE id = ${merchant.id}`;

            updated++;
            const fields = Object.keys(updates).join(", ");
            console.log(`  ✓ ${merchant.business_name}: ${fields}`);
          }
        } catch (err) {
          console.warn(`  ✗ ${merchant.business_name}: ${err}`);
          failed++;
        }
      })
    );

    // Progress
    const progress = Math.min(i + BATCH_SIZE, merchants.length);
    if (progress % 50 === 0 || progress === merchants.length) {
      console.log(`\n  Progress: ${progress}/${merchants.length}\n`);
    }

    // Rate limit delay
    if (i + BATCH_SIZE < merchants.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log();
  console.log("=".repeat(60));
  console.log("DONE");
  console.log("=".repeat(60));
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped (no new data): ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log();

  await db.end();
}

main();
