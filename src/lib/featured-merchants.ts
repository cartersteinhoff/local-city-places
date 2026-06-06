import { and, asc, eq } from "drizzle-orm";
import { categories, db, merchants } from "@/db";
import type { FeaturedMerchant } from "@/lib/featured-merchants-types";

export const FEATURED_MERCHANT_CACHE_SECONDS = 3600;
export const FEATURED_MERCHANT_CACHE_TAG = "featured-merchants";
export const FEATURED_MERCHANT_LIMIT = 15;

function getCappedLimit(limit: number) {
  if (!Number.isFinite(limit)) return FEATURED_MERCHANT_LIMIT;

  return Math.min(FEATURED_MERCHANT_LIMIT, Math.max(1, Math.floor(limit)));
}

function getPrimaryImageUrl(photos: string[] | null) {
  return Array.isArray(photos) ? (photos.find(Boolean) ?? null) : null;
}

export async function getFeaturedMerchants(
  limit = FEATURED_MERCHANT_LIMIT,
): Promise<FeaturedMerchant[]> {
  const cappedLimit = getCappedLimit(limit);

  const featured = await db
    .select({
      id: merchants.id,
      businessName: merchants.businessName,
      city: merchants.city,
      state: merchants.state,
      slug: merchants.slug,
      logoUrl: merchants.logoUrl,
      photos: merchants.photos,
      categoryName: categories.name,
    })
    .from(merchants)
    .leftJoin(categories, eq(merchants.categoryId, categories.id))
    .where(
      and(
        eq(merchants.featuredOnHomepage, true),
        eq(merchants.isPublicPage, true),
      ),
    )
    .orderBy(asc(merchants.businessName))
    .limit(cappedLimit);

  return featured.map(({ photos, ...merchant }) => ({
    ...merchant,
    imageUrl: getPrimaryImageUrl(photos),
  }));
}
