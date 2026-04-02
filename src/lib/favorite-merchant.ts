import { and, desc, eq } from "drizzle-orm";
import {
  db,
  favoriteMerchantTestimonials,
  grcs,
  merchants,
  monthlyQualifications,
} from "@/db";
import { sendGrcIssuedEmail } from "@/lib/email";
import { slugify } from "@/lib/utils";

const FAVORITE_MERCHANT_REWARD_MERCHANT_NAME =
  process.env.FAVORITE_MERCHANT_REWARD_MERCHANT_NAME || "Local City Places Rewards";
const FAVORITE_MERCHANT_REWARD_DENOMINATION = 25;
const FAVORITE_MERCHANT_REWARD_MONTHS = 1;

export async function ensureFavoriteMerchantRewardMerchant() {
  const [existingMerchant] = await db
    .select({
      id: merchants.id,
      businessName: merchants.businessName,
    })
    .from(merchants)
    .where(eq(merchants.businessName, FAVORITE_MERCHANT_REWARD_MERCHANT_NAME))
    .limit(1);

  if (existingMerchant) {
    return existingMerchant;
  }

  const [createdMerchant] = await db
    .insert(merchants)
    .values({
      businessName: FAVORITE_MERCHANT_REWARD_MERCHANT_NAME,
      slug: slugify(FAVORITE_MERCHANT_REWARD_MERCHANT_NAME),
      description:
        "Internal Local City Places merchant record used for Favorite Merchant sweepstakes reward certificates.",
      isPublicPage: false,
      verified: true,
    })
    .returning({
      id: merchants.id,
      businessName: merchants.businessName,
    });

  return createdMerchant;
}

interface IssueFavoriteMerchantRewardParams {
  testimonialId: string;
  recipientEmail: string;
  recipientName?: string | null;
}

export async function issueFavoriteMerchantReward({
  testimonialId,
  recipientEmail,
  recipientName,
}: IssueFavoriteMerchantRewardParams) {
  const rewardMerchant = await ensureFavoriteMerchantRewardMerchant();

  const [existingReward] = await db
    .select({
      id: grcs.id,
    })
    .from(grcs)
    .where(
      and(
        eq(grcs.sourceType, "favorite_merchant_testimonial"),
        eq(grcs.sourceReferenceId, testimonialId)
      )
    )
    .limit(1);

  let rewardGrcId = existingReward?.id ?? null;
  let emailSent = false;

  if (!rewardGrcId) {
    const [createdReward] = await db
      .insert(grcs)
      .values({
        merchantId: rewardMerchant.id,
        denomination: FAVORITE_MERCHANT_REWARD_DENOMINATION,
        costPerCert: "0.00",
        recipientEmail: recipientEmail.toLowerCase(),
        recipientName: recipientName?.trim() || null,
        monthsRemaining: FAVORITE_MERCHANT_REWARD_MONTHS,
        status: "pending",
        issuedAt: new Date(),
        sourceType: "favorite_merchant_testimonial",
        sourceReferenceId: testimonialId,
      })
      .returning({
        id: grcs.id,
      });

    rewardGrcId = createdReward.id;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const claimUrl = `${appUrl}/api/grc/${rewardGrcId}/claim`;

    emailSent = await sendGrcIssuedEmail({
      recipientEmail: recipientEmail.toLowerCase(),
      recipientName: recipientName?.trim() || undefined,
      merchantName: rewardMerchant.businessName,
      denomination: FAVORITE_MERCHANT_REWARD_DENOMINATION,
      totalMonths: FAVORITE_MERCHANT_REWARD_MONTHS,
      claimUrl,
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    rewardMerchantId: rewardMerchant.id,
    rewardMerchantName: rewardMerchant.businessName,
    rewardGrcId,
    rewardClaimUrl: `${appUrl}/api/grc/${rewardGrcId}/claim`,
    emailSent,
  };
}

export async function syncFavoriteMerchantRewardStatusForGrc(grcId: string) {
  const [rewardGrc] = await db
    .select({
      id: grcs.id,
      status: grcs.status,
      sourceType: grcs.sourceType,
      sourceReferenceId: grcs.sourceReferenceId,
    })
    .from(grcs)
    .where(eq(grcs.id, grcId))
    .limit(1);

  if (
    !rewardGrc ||
    rewardGrc.sourceType !== "favorite_merchant_testimonial" ||
    !rewardGrc.sourceReferenceId
  ) {
    return null;
  }

  const [qualification] = await db
    .select({
      status: monthlyQualifications.status,
      rewardSentAt: monthlyQualifications.rewardSentAt,
    })
    .from(monthlyQualifications)
    .where(eq(monthlyQualifications.grcId, rewardGrc.id))
    .orderBy(desc(monthlyQualifications.year), desc(monthlyQualifications.month))
    .limit(1);

  let nextRewardStatus: typeof favoriteMerchantTestimonials.$inferInsert.rewardStatus =
    "registration_required";

  if (rewardGrc.status === "expired") {
    nextRewardStatus = "void";
  } else if (qualification?.rewardSentAt) {
    nextRewardStatus = "fulfilled";
  } else if (qualification?.status === "qualified") {
    nextRewardStatus = "qualified";
  } else if (rewardGrc.status === "active" || rewardGrc.status === "completed") {
    nextRewardStatus = "qualifying";
  }

  await db
    .update(favoriteMerchantTestimonials)
    .set({
      rewardStatus: nextRewardStatus,
      rewardReferenceId: rewardGrc.id,
      updatedAt: new Date(),
    })
    .where(eq(favoriteMerchantTestimonials.id, rewardGrc.sourceReferenceId));

  return nextRewardStatus;
}
