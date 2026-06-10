import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  categories,
  db,
  type MerchantCampaignAudio,
  merchantInvites,
  merchants,
  reviews,
} from "@/db";
import { getSession } from "@/lib/auth";
import { calculateCompletion } from "@/lib/merchant-completion";

const merchantTrialDays = 14;
const dayMs = 24 * 60 * 60 * 1000;

function getCampaignTrack(
  campaignAudio: MerchantCampaignAudio | null,
  businessName: string,
) {
  const asset = campaignAudio?.soundtrack || campaignAudio?.radioSpot;

  if (!asset?.url) {
    return {
      title: `${businessName} campaign soundtrack`,
      description:
        "A custom audio asset produced for your local media campaign.",
      audioSrc: null,
      status: "in_production" as const,
      updatedAt: campaignAudio?.updatedAt || null,
    };
  }

  return {
    title: asset.title || `${businessName} campaign audio`,
    description:
      asset.description ||
      "Final campaign audio produced for your local media package.",
    audioSrc: asset.url,
    status: asset.status || ("ready" as const),
    updatedAt: asset.uploadedAt || campaignAudio?.updatedAt || null,
  };
}

function getMerchantTrialProgress(usedAt: Date | null | undefined) {
  if (!usedAt) return null;

  const now = new Date();
  const startedAt = new Date(usedAt);
  const endsAt = new Date(startedAt.getTime() + merchantTrialDays * dayMs);
  const elapsedMs = now.getTime() - startedAt.getTime();

  if (elapsedMs < 0 || now.getTime() >= endsAt.getTime()) {
    return null;
  }

  return {
    day: Math.min(merchantTrialDays, Math.floor(elapsedMs / dayMs) + 1),
    totalDays: merchantTrialDays,
    startedAt: startedAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
}

export async function GET() {
  try {
    const session = await getSession();
    if (
      !session ||
      (session.user.role !== "merchant" && session.user.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [merchant] = await db
      .select({
        id: merchants.id,
        businessName: merchants.businessName,
        categoryId: merchants.categoryId,
        categoryName: categories.name,
        isPublicPage: merchants.isPublicPage,
        verified: merchants.verified,
        streetAddress: merchants.streetAddress,
        city: merchants.city,
        state: merchants.state,
        zipCode: merchants.zipCode,
        slug: merchants.slug,
        logoUrl: merchants.logoUrl,
        description: merchants.description,
        phone: merchants.phone,
        website: merchants.website,
        aboutStory: merchants.aboutStory,
        hours: merchants.hours,
        instagramUrl: merchants.instagramUrl,
        facebookUrl: merchants.facebookUrl,
        tiktokUrl: merchants.tiktokUrl,
        vimeoUrl: merchants.vimeoUrl,
        photos: merchants.photos,
        services: merchants.services,
        campaignAudio: merchants.campaignAudio,
        updatedAt: merchants.updatedAt,
      })
      .from(merchants)
      .leftJoin(categories, eq(merchants.categoryId, categories.id))
      .where(eq(merchants.userId, session.user.id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 },
      );
    }

    const [merchantTrialInvite] = await db
      .select({
        usedAt: merchantInvites.usedAt,
      })
      .from(merchantInvites)
      .where(
        and(
          eq(merchantInvites.usedByUserId, session.user.id),
          isNotNull(merchantInvites.usedAt),
        ),
      )
      .orderBy(desc(merchantInvites.usedAt))
      .limit(1);
    const trialStartedAt =
      merchantTrialInvite?.usedAt ||
      (session.user.role === "admin" ? merchant.updatedAt : null);

    const [reviewStats] = await db
      .select({
        totalReviews: sql<number>`count(*)::int`,
        avgWordCount: sql<number>`coalesce(avg(${reviews.wordCount}), 0)::int`,
      })
      .from(reviews)
      .where(eq(reviews.merchantId, merchant.id));

    const recentReviews = await db
      .select({
        id: reviews.id,
        content: reviews.content,
        wordCount: reviews.wordCount,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(eq(reviews.merchantId, merchant.id))
      .orderBy(desc(reviews.createdAt))
      .limit(5);

    const completion = calculateCompletion({
      businessName: merchant.businessName,
      categoryId: merchant.categoryId || undefined,
      description: merchant.description || undefined,
      aboutStory: merchant.aboutStory || undefined,
      streetAddress: merchant.streetAddress || undefined,
      city: merchant.city || undefined,
      state: merchant.state || undefined,
      zipCode: merchant.zipCode || undefined,
      phone: merchant.phone || undefined,
      website: merchant.website || undefined,
      instagramUrl: merchant.instagramUrl || undefined,
      facebookUrl: merchant.facebookUrl || undefined,
      tiktokUrl: merchant.tiktokUrl || undefined,
      hours: merchant.hours || undefined,
      logoUrl: merchant.logoUrl || undefined,
      vimeoUrl: merchant.vimeoUrl || undefined,
      photos: merchant.photos || undefined,
      services: merchant.services || undefined,
    });

    return NextResponse.json({
      merchant: {
        id: merchant.id,
        businessName: merchant.businessName,
        categoryId: merchant.categoryId,
        categoryName: merchant.categoryName,
        isPublicPage: merchant.isPublicPage,
        verified: merchant.verified,
        city: merchant.city,
        state: merchant.state,
        slug: merchant.slug,
        logoUrl: merchant.logoUrl,
        description: merchant.description,
        phone: merchant.phone,
        website: merchant.website,
        photoCount: merchant.photos?.length || 0,
        campaignAudio: merchant.campaignAudio,
        updatedAt: merchant.updatedAt.toISOString(),
      },
      campaignTrack: getCampaignTrack(
        merchant.campaignAudio || null,
        merchant.businessName,
      ),
      merchantTrial: getMerchantTrialProgress(trialStartedAt),
      pageManagement: {
        completionPercentage: completion.percentage,
        completedFields: completion.completed,
        totalFields: completion.total,
        missingSections: completion.sections
          .filter((section) => section.missingFields.length > 0)
          .map((section) => ({
            label: section.label,
            missingFields: section.missingFields,
          }))
          .slice(0, 3),
      },
      stats: {
        totalReviews: Number(reviewStats?.totalReviews) || 0,
        avgWordCount: Number(reviewStats?.avgWordCount) || 0,
      },
      recentReviews: recentReviews.map((review) => ({
        id: review.id,
        content: review.content,
        wordCount: review.wordCount,
        createdAt: review.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
