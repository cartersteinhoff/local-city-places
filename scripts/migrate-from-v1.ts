/**
 * Migration script: Import data from Local City Places 1.0 (Supabase) to 2.0 (Neon)
 *
 * Usage: npx tsx scripts/migrate-from-v1.ts
 *
 * Requires:
 *   - .env.local with DATABASE_URL (Neon - destination)
 *   - BLOB_READ_WRITE_TOKEN in .env.local (for Vercel Blob uploads)
 *
 * Categories and merchants were already imported in a prior run.
 * This script imports: reviews (with denormalized reviewer info) and review photos.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { put } from "@vercel/blob";

// ============================================================================
// CONFIG
// ============================================================================

const OLD_DB_URL =
  process.env.OLD_DATABASE_URL ||
  "postgresql://postgres:cNLm-K9kZ%23WE%23M%40@db.hvaxqdqsnxjounjkcykq.supabase.co:5432/postgres";

const NEW_DB_URL = process.env.DATABASE_URL!;
if (!NEW_DB_URL) throw new Error("DATABASE_URL not set in .env.local");

const SUPABASE_STORAGE_URL =
  "https://hvaxqdqsnxjounjkcykq.supabase.co/storage/v1/object/public";

const PHOTO_BATCH_SIZE = 10;

// ============================================================================
// DB CONNECTIONS
// ============================================================================

const oldDb = postgres(OLD_DB_URL);
const newDb = postgres(NEW_DB_URL);

// ============================================================================
// HELPERS
// ============================================================================

function log(step: string, msg: string) {
  console.log(`[${step}] ${msg}`);
}

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

async function downloadBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  Failed to download ${url}: ${res.status}`);
      return null;
    }
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    console.warn(`  Error downloading ${url}:`, err);
    return null;
  }
}

async function uploadToBlob(
  buffer: Buffer,
  pathname: string,
  contentType: string
): Promise<string> {
  const blob = await put(pathname, buffer, {
    access: "public",
    contentType,
  });
  return blob.url;
}

function guessContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    default:
      return "image/jpeg";
  }
}

// ============================================================================
// Build merchant ID map (old business_id → new merchant UUID)
// ============================================================================

async function buildMerchantIdMap() {
  log("merchants", "Building merchant ID map from google_place_id...");

  // Get old businesses with their google_place_id
  const oldBusinesses = await oldDb`
    SELECT id, google_place_id, slug FROM businesses
    WHERE review_count > 0 AND deleted_at IS NULL
    ORDER BY id
  `;

  // Get new merchants
  const newMerchants = await newDb`SELECT id, google_place_id, slug FROM merchants`;
  const newByPlaceId = new Map<string, string>();
  const newBySlug = new Map<string, string>();
  for (const m of newMerchants) {
    if (m.google_place_id) newByPlaceId.set(m.google_place_id, m.id);
    if (m.slug) newBySlug.set(m.slug, m.id);
  }

  const merchantIdMap = new Map<number, string>();
  let matched = 0;
  let unmatched = 0;

  for (const b of oldBusinesses) {
    if (b.google_place_id && newByPlaceId.has(b.google_place_id)) {
      merchantIdMap.set(b.id, newByPlaceId.get(b.google_place_id)!);
      matched++;
    } else {
      // Try slug-based match (new slugs have -shortid suffix, old don't)
      const found = newMerchants.find((m) => m.slug?.startsWith(b.slug + "-"));
      if (found) {
        merchantIdMap.set(b.id, found.id);
        matched++;
      } else {
        unmatched++;
      }
    }
  }

  log("merchants", `Mapped ${matched} merchants, ${unmatched} unmatched`);
  return merchantIdMap;
}

// ============================================================================
// Build reviewer info map (old user_id → { firstName, lastName, photoUrl })
// ============================================================================

async function buildReviewerMap() {
  log("reviewers", "Building reviewer info map...");

  const oldUsers = await oldDb`
    SELECT id, first_name, last_name, profile_photo
    FROM users
    WHERE id IN (SELECT DISTINCT user_id FROM reviews WHERE status = 'approved')
  `;

  const reviewerMap = new Map<
    string,
    { firstName: string | null; lastName: string | null; profilePhoto: string | null }
  >();

  for (const u of oldUsers) {
    reviewerMap.set(u.id, {
      firstName: u.first_name || null,
      lastName: u.last_name || null,
      profilePhoto: u.profile_photo || null,
    });
  }

  log("reviewers", `Found ${reviewerMap.size} reviewers`);
  return reviewerMap;
}

// ============================================================================
// Migrate profile photos for reviewers → Vercel Blob, return URL map
// ============================================================================

async function migrateProfilePhotos(
  reviewerMap: Map<string, { firstName: string | null; lastName: string | null; profilePhoto: string | null }>
) {
  log("profiles", "Migrating reviewer profile photos to Vercel Blob...");

  const usersWithPhotos = [...reviewerMap.entries()].filter(([, v]) => v.profilePhoto);
  log("profiles", `Found ${usersWithPhotos.length} reviewers with profile photos`);

  // Map old user_id → blob URL
  const photoUrlMap = new Map<string, string>();
  let migrated = 0;
  let failed = 0;

  for (let i = 0; i < usersWithPhotos.length; i += PHOTO_BATCH_SIZE) {
    const batch = usersWithPhotos.slice(i, i + PHOTO_BATCH_SIZE);

    await Promise.all(
      batch.map(async ([userId, info]) => {
        const sourceUrl = `${SUPABASE_STORAGE_URL}/profile-photos/${info.profilePhoto}`;
        const buffer = await downloadBuffer(sourceUrl);
        if (!buffer) {
          failed++;
          return;
        }

        const filename = info.profilePhoto!.split("/").pop() || "profile.jpg";
        const blobPath = `reviewer-photos/${Date.now()}-${filename}`;
        const contentType = guessContentType(filename);

        try {
          const blobUrl = await uploadToBlob(buffer, blobPath, contentType);
          photoUrlMap.set(userId, blobUrl);
          migrated++;
        } catch (err) {
          console.warn(`  Failed to upload profile for ${userId}:`, err);
          failed++;
        }
      })
    );
  }

  log("profiles", `Done. ${migrated} profile photos migrated, ${failed} failed.`);
  return photoUrlMap;
}

// ============================================================================
// Import Reviews (with denormalized reviewer info)
// ============================================================================

async function importReviews(
  merchantIdMap: Map<number, string>,
  reviewerMap: Map<string, { firstName: string | null; lastName: string | null; profilePhoto: string | null }>,
  photoUrlMap: Map<string, string>
) {
  log("reviews", "Importing approved reviews...");

  const oldReviews = await oldDb`
    SELECT * FROM reviews WHERE status = 'approved' ORDER BY id
  `;
  log("reviews", `Found ${oldReviews.length} approved reviews`);

  const reviewIdMap = new Map<number, string>();
  let skipped = 0;

  for (const r of oldReviews) {
    const newMerchantId = merchantIdMap.get(r.business_id);
    if (!newMerchantId) {
      skipped++;
      continue;
    }

    const reviewer = reviewerMap.get(r.user_id);
    const firstName = reviewer?.firstName || null;
    const lastName = reviewer?.lastName || null;
    const photoUrl = photoUrlMap.get(r.user_id) || null;
    const wc = wordCount(r.review_text);

    const [inserted] = await newDb`
      INSERT INTO reviews (
        merchant_id, content, word_count, rating, status,
        reviewer_first_name, reviewer_last_name, reviewer_photo_url,
        created_at
      ) VALUES (
        ${newMerchantId}, ${r.review_text}, ${wc}, ${r.rating}, 'approved',
        ${firstName}, ${lastName}, ${photoUrl},
        ${r.created_at}
      )
      RETURNING id
    `;
    reviewIdMap.set(r.id, inserted.id);

    if (reviewIdMap.size % 100 === 0) {
      log("reviews", `  Progress: ${reviewIdMap.size}/${oldReviews.length}`);
    }
  }

  log("reviews", `Done. ${reviewIdMap.size} reviews imported, ${skipped} skipped.`);
  return reviewIdMap;
}

// ============================================================================
// Migrate Review Photos to Vercel Blob
// ============================================================================

async function migrateReviewPhotos(reviewIdMap: Map<number, string>) {
  log("photos", "Migrating review photos to Vercel Blob...");

  const oldPhotos = await oldDb`
    SELECT rp.* FROM review_photos rp
    JOIN reviews r ON rp.review_id = r.id
    WHERE r.status = 'approved'
    ORDER BY rp.review_id, rp.display_order
  `;
  log("photos", `Found ${oldPhotos.length} review photos to migrate`);

  let migrated = 0;
  let failed = 0;

  for (let i = 0; i < oldPhotos.length; i += PHOTO_BATCH_SIZE) {
    const batch = oldPhotos.slice(i, i + PHOTO_BATCH_SIZE);

    await Promise.all(
      batch.map(async (photo) => {
        const newReviewId = reviewIdMap.get(photo.review_id);
        if (!newReviewId) {
          failed++;
          return;
        }

        const sourceUrl = `${SUPABASE_STORAGE_URL}/review-photos/${photo.file_path}`;
        const buffer = await downloadBuffer(sourceUrl);
        if (!buffer) {
          failed++;
          return;
        }

        const filename = photo.file_path.split("/").pop() || "photo.jpg";
        const blobPath = `review-photos/${newReviewId}/${Date.now()}-${filename}`;
        const contentType = guessContentType(filename);

        try {
          const blobUrl = await uploadToBlob(buffer, blobPath, contentType);

          await newDb`
            INSERT INTO review_photos (review_id, url, display_order)
            VALUES (${newReviewId}, ${blobUrl}, ${photo.display_order})
          `;
          migrated++;
        } catch (err) {
          console.warn(`  Failed to upload ${photo.file_path}:`, err);
          failed++;
        }
      })
    );

    if ((i + PHOTO_BATCH_SIZE) % 100 < PHOTO_BATCH_SIZE) {
      log("photos", `  Progress: ${migrated} migrated, ${failed} failed of ${oldPhotos.length}`);
    }
  }

  log("photos", `Done. ${migrated} photos migrated, ${failed} failed.`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("=".repeat(60));
  console.log("Local City Places 1.0 → 2.0 Migration (Reviews + Photos)");
  console.log("=".repeat(60));
  console.log();

  try {
    // Build merchant ID map from already-imported merchants
    const merchantIdMap = await buildMerchantIdMap();
    console.log();

    // Build reviewer info (name + profile photo path) from old DB
    const reviewerMap = await buildReviewerMap();
    console.log();

    // Migrate profile photos to Vercel Blob (stored on review rows, not user accounts)
    const photoUrlMap = await migrateProfilePhotos(reviewerMap);
    console.log();

    // Import reviews with denormalized reviewer info
    const reviewIdMap = await importReviews(merchantIdMap, reviewerMap, photoUrlMap);
    console.log();

    // Migrate review photos
    await migrateReviewPhotos(reviewIdMap);
    console.log();

    // Summary
    console.log("=".repeat(60));
    console.log("MIGRATION COMPLETE");
    console.log("=".repeat(60));
    console.log(`  Merchants matched: ${merchantIdMap.size}`);
    console.log(`  Reviews imported: ${reviewIdMap.size}`);
    console.log(`  Reviewer photos: ${photoUrlMap.size}`);
    console.log();
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await oldDb.end();
    await newDb.end();
  }
}

main();
