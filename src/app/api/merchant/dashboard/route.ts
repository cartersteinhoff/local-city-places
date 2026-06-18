import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  categories,
  db,
  type MerchantCampaignAudio,
  merchantOwners,
  merchantServiceAgreementAcceptances,
  merchants,
  reviews,
} from "@/db";
import { getSession } from "@/lib/auth";
import { getMerchantAgreementPdfHref } from "@/lib/legal/merchant-agreement-pdf";
import { calculateCompletion } from "@/lib/merchant-completion";
import {
  merchantOwnerJoin,
  merchantOwnerWhere,
} from "@/lib/merchant-ownership";
import { getMerchantTrialProgress } from "@/lib/merchant-trial";

function getCampaignAudioAsset(
  campaignAudio: MerchantCampaignAudio | null,
  businessName: string,
  kind: "radioSpot" | "soundtrack" | "soundtrack2",
) {
  const asset = campaignAudio?.[kind];
  const isRadioSpot = kind === "radioSpot";
  const isSecondSoundtrack = kind === "soundtrack2";

  if (!asset?.url) {
    return {
      title: isRadioSpot
        ? `${businessName} KLCP radio spot`
        : isSecondSoundtrack
          ? `${businessName} signature soundtrack 2`
          : `${businessName} signature soundtrack 1`,
      description: isRadioSpot
        ? "Radio spot audio appears here after it is uploaded."
        : isSecondSoundtrack
          ? "An alternate custom audio asset produced for your local media campaign."
          : "A custom audio asset produced for your local media campaign.",
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

async function getMarketLockPaymentHistory(merchantId: string) {
  try {
    return await db
      .select({
        id: merchantServiceAgreementAcceptances.id,
        agreementTitle: merchantServiceAgreementAcceptances.agreementTitle,
        agreementVersion: merchantServiceAgreementAcceptances.agreementVersion,
        checkoutSessionId:
          merchantServiceAgreementAcceptances.checkoutSessionId,
        paidAt: merchantServiceAgreementAcceptances.paidAt,
        paymentAmountCents:
          merchantServiceAgreementAcceptances.paymentAmountCents,
        paymentCurrency: merchantServiceAgreementAcceptances.paymentCurrency,
        paymentStatus: merchantServiceAgreementAcceptances.paymentStatus,
        servicePeriodLabel:
          merchantServiceAgreementAcceptances.servicePeriodLabel,
        signedAt: merchantServiceAgreementAcceptances.acceptedAt,
        typedName: merchantServiceAgreementAcceptances.typedName,
      })
      .from(merchantServiceAgreementAcceptances)
      .where(eq(merchantServiceAgreementAcceptances.merchantId, merchantId))
      .orderBy(desc(merchantServiceAgreementAcceptances.acceptedAt))
      .limit(12);
  } catch (error) {
    console.warn("MarketLock360 payment history unavailable:", error);
    return [];
  }
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
        marketLockStatus: merchants.marketLockStatus,
        marketLockStatusUpdatedAt: merchants.marketLockStatusUpdatedAt,
        updatedAt: merchants.updatedAt,
      })
      .from(merchants)
      .leftJoin(categories, eq(merchants.categoryId, categories.id))
      .leftJoin(merchantOwners, merchantOwnerJoin(session.user.id))
      .where(merchantOwnerWhere(session.user.id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 },
      );
    }

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
    const marketLockPaymentHistory = await getMarketLockPaymentHistory(
      merchant.id,
    );

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
        marketLockStatus: merchant.marketLockStatus,
        updatedAt: merchant.updatedAt.toISOString(),
      },
      campaignTrack: getCampaignAudioAsset(
        merchant.campaignAudio || null,
        merchant.businessName,
        "soundtrack",
      ),
      campaignTracks: [
        getCampaignAudioAsset(
          merchant.campaignAudio || null,
          merchant.businessName,
          "soundtrack",
        ),
        getCampaignAudioAsset(
          merchant.campaignAudio || null,
          merchant.businessName,
          "soundtrack2",
        ),
      ],
      radioSpot: getCampaignAudioAsset(
        merchant.campaignAudio || null,
        merchant.businessName,
        "radioSpot",
      ),
      merchantTrial:
        merchant.marketLockStatus === "trial"
          ? getMerchantTrialProgress(merchant.marketLockStatusUpdatedAt)
          : null,
      marketLockPaymentHistory: marketLockPaymentHistory.map((item) => ({
        id: item.id,
        agreementPdfUrl: getMerchantAgreementPdfHref(item.id),
        agreementTitle: item.agreementTitle,
        agreementVersion: item.agreementVersion,
        paidAt: item.paidAt?.toISOString() ?? null,
        paymentAmountCents: item.paymentAmountCents,
        paymentCurrency: item.paymentCurrency,
        paymentStatus:
          item.paymentStatus ||
          (item.checkoutSessionId ? "unpaid" : "agreement_signed"),
        servicePeriodLabel: item.servicePeriodLabel,
        signedAt: item.signedAt.toISOString(),
        typedName: item.typedName,
      })),
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
