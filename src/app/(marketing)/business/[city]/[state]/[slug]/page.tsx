import { and, desc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArtDecoDesign } from "@/components/merchant-page/designs/art-deco";
import { db } from "@/db";
import {
  categories,
  favoriteMerchantTestimonialPhotos,
  favoriteMerchantTestimonials,
  members,
  merchants,
  reviewPhotos,
  reviews,
  users,
} from "@/db/schema";

// Cache pages, auto-revalidate every hour as fallback
// Admin can manually trigger rebuild for instant updates
export const revalidate = 3600; // 1 hour

interface PageProps {
  params: Promise<{
    city: string;
    state: string;
    slug: string;
  }>;
}

async function getMerchantBySlug(slug: string) {
  const [merchant] = await db
    .select({
      id: merchants.id,
      businessName: merchants.businessName,
      streetAddress: merchants.streetAddress,
      city: merchants.city,
      state: merchants.state,
      zipCode: merchants.zipCode,
      phone: merchants.phone,
      website: merchants.website,
      vimeoUrl: merchants.vimeoUrl,
      slug: merchants.slug,
      categoryName: categories.name,
      description: merchants.description,
      logoUrl: merchants.logoUrl,
      googlePlaceId: merchants.googlePlaceId,
      hours: merchants.hours,
      instagramUrl: merchants.instagramUrl,
      facebookUrl: merchants.facebookUrl,
      tiktokUrl: merchants.tiktokUrl,
      photos: merchants.photos,
      services: merchants.services,
      aboutStory: merchants.aboutStory,
    })
    .from(merchants)
    .leftJoin(categories, eq(merchants.categoryId, categories.id))
    .where(eq(merchants.slug, slug))
    .limit(1);

  return merchant;
}

async function getMerchantReviews(merchantId: string) {
  const merchantReviews = await db
    .select({
      id: reviews.id,
      content: reviews.content,
      rating: reviews.rating,
      reviewerFirstName: reviews.reviewerFirstName,
      reviewerLastName: reviews.reviewerLastName,
      reviewerPhotoUrl: reviews.reviewerPhotoUrl,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .where(eq(reviews.merchantId, merchantId))
    .orderBy(desc(reviews.createdAt));

  const reviewIds = merchantReviews.map((r) => r.id);

  const photos =
    reviewIds.length > 0
      ? await db
          .select({
            reviewId: reviewPhotos.reviewId,
            url: reviewPhotos.url,
            displayOrder: reviewPhotos.displayOrder,
          })
          .from(reviewPhotos)
          .where(inArray(reviewPhotos.reviewId, reviewIds))
      : [];

  const photosByReview = new Map<
    string,
    { url: string; displayOrder: number | null }[]
  >();
  for (const p of photos) {
    if (!photosByReview.has(p.reviewId)) photosByReview.set(p.reviewId, []);
    photosByReview.get(p.reviewId)?.push(p);
  }

  return merchantReviews.map((r) => ({
    ...r,
    photos: (photosByReview.get(r.id) || [])
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map((p) => p.url),
  }));
}

async function getFavoriteMerchantNominations(merchantId: string) {
  const approvedNominations = await db
    .select({
      id: favoriteMerchantTestimonials.id,
      content: favoriteMerchantTestimonials.content,
      createdAt: favoriteMerchantTestimonials.createdAt,
      memberFirstName: users.firstName,
      memberLastName: users.lastName,
      memberPhotoUrl: users.profilePhotoUrl,
    })
    .from(favoriteMerchantTestimonials)
    .innerJoin(members, eq(favoriteMerchantTestimonials.memberId, members.id))
    .innerJoin(users, eq(members.userId, users.id))
    .where(
      and(
        eq(favoriteMerchantTestimonials.merchantId, merchantId),
        eq(favoriteMerchantTestimonials.status, "approved"),
      ),
    )
    .orderBy(desc(favoriteMerchantTestimonials.createdAt));

  const nominationIds = approvedNominations.map((nomination) => nomination.id);

  const photos =
    nominationIds.length > 0
      ? await db
          .select({
            testimonialId: favoriteMerchantTestimonialPhotos.testimonialId,
            url: favoriteMerchantTestimonialPhotos.url,
            displayOrder: favoriteMerchantTestimonialPhotos.displayOrder,
            status: favoriteMerchantTestimonialPhotos.status,
            moderatedAt: favoriteMerchantTestimonialPhotos.moderatedAt,
          })
          .from(favoriteMerchantTestimonialPhotos)
          .where(
            inArray(
              favoriteMerchantTestimonialPhotos.testimonialId,
              nominationIds,
            ),
          )
      : [];

  const photosByNomination = new Map<
    string,
    Array<{
      url: string;
      displayOrder: number;
      status: "pending" | "approved" | "rejected";
      moderatedAt: Date | null;
    }>
  >();
  for (const photo of photos) {
    if (!photosByNomination.has(photo.testimonialId)) {
      photosByNomination.set(photo.testimonialId, []);
    }
    photosByNomination.get(photo.testimonialId)?.push(photo);
  }

  return approvedNominations.map((nomination) => ({
    ...nomination,
    photos: (() => {
      const nominationPhotos = (
        photosByNomination.get(nomination.id) || []
      ).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      const hasReviewedPhotos = nominationPhotos.some(
        (photo) => photo.status !== "pending" || photo.moderatedAt !== null,
      );

      return nominationPhotos
        .filter((photo) =>
          hasReviewedPhotos ? photo.status === "approved" : true,
        )
        .map((photo) => photo.url);
    })(),
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const merchant = await getMerchantBySlug(slug);

  if (!merchant) {
    return {
      title: "Business Not Found",
    };
  }

  const location = [merchant.city, merchant.state].filter(Boolean).join(", ");
  const title = location
    ? `${merchant.businessName} | ${location}`
    : merchant.businessName;

  return {
    title,
    description:
      merchant.description || `Visit ${merchant.businessName} in ${location}`,
    openGraph: {
      title,
      description:
        merchant.description || `Visit ${merchant.businessName} in ${location}`,
      type: "website",
    },
  };
}

export default async function MerchantPage({ params }: PageProps) {
  const { slug } = await params;
  const merchant = await getMerchantBySlug(slug);

  if (!merchant) {
    notFound();
  }

  const [merchantReviews, merchantNominations] = await Promise.all([
    getMerchantReviews(merchant.id),
    getFavoriteMerchantNominations(merchant.id),
  ]);

  return (
    <ArtDecoDesign
      merchantId={merchant.id}
      businessName={merchant.businessName}
      streetAddress={merchant.streetAddress}
      city={merchant.city}
      state={merchant.state}
      zipCode={merchant.zipCode}
      logoUrl={merchant.logoUrl}
      categoryName={merchant.categoryName}
      phone={merchant.phone}
      website={merchant.website}
      description={merchant.description}
      vimeoUrl={merchant.vimeoUrl}
      googlePlaceId={merchant.googlePlaceId}
      hours={merchant.hours}
      instagramUrl={merchant.instagramUrl}
      facebookUrl={merchant.facebookUrl}
      tiktokUrl={merchant.tiktokUrl}
      photos={merchant.photos}
      services={merchant.services}
      aboutStory={merchant.aboutStory}
      reviews={merchantReviews}
      favoriteMerchantTestimonials={merchantNominations}
    />
  );
}
