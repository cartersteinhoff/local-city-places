import { and, eq } from "drizzle-orm";
import { db, grcs, merchants } from "@/db";
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
