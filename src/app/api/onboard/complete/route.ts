import { NextRequest, NextResponse } from "next/server";
import { hashToken, createMagicLinkToken } from "@/lib/auth";
import { db, merchantInvites } from "@/db";
import { eq, and, gt, isNull } from "drizzle-orm";
import {
  createMerchantWithTrialGrcs,
  validateEmailForMerchant,
  TRIAL_GRC_QUANTITY,
  TRIAL_GRC_DENOMINATION,
} from "@/lib/merchant-onboarding";
import { sendMerchantWelcomeEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      token,
      email,
      businessName,
      city,
      categoryId,
      phone,
      website,
      description,
      googlePlaceId,
      logoUrl,
    } = body;

    // Validate required fields
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!businessName) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }

    const hashedToken = hashToken(token);

    // Find and validate the invite
    const [invite] = await db
      .select()
      .from(merchantInvites)
      .where(
        and(
          eq(merchantInvites.token, hashedToken),
          isNull(merchantInvites.usedAt),
          gt(merchantInvites.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 400 }
      );
    }

    // Validate email can be used for merchant
    const validationError = await validateEmailForMerchant(email);
    if (validationError) {
      return NextResponse.json(
        { error: validationError.message, errorType: validationError.type },
        { status: 400 }
      );
    }

    // Create merchant with trial GRCs
    const result = await createMerchantWithTrialGrcs({
      email,
      businessName,
      city,
      categoryId,
      phone,
      website,
      description,
      logoUrl,
      googlePlaceId,
    });

    // Mark invite as used
    await db
      .update(merchantInvites)
      .set({
        usedAt: new Date(),
        usedByUserId: result.user.id,
      })
      .where(eq(merchantInvites.id, invite.id));

    // Create magic link token for auto-login
    const magicToken = await createMagicLinkToken(email);
    const loginUrl = `${APP_URL}/api/auth/verify?token=${magicToken}`;

    // Send welcome email
    await sendMerchantWelcomeEmail({
      email,
      businessName,
      loginUrl,
      trialGrcCount: TRIAL_GRC_QUANTITY,
      trialGrcDenomination: TRIAL_GRC_DENOMINATION,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
      },
      merchant: {
        id: result.merchant.id,
        businessName: result.merchant.businessName,
      },
      trialGrcs: {
        quantity: TRIAL_GRC_QUANTITY,
        denomination: TRIAL_GRC_DENOMINATION,
        totalValue: TRIAL_GRC_QUANTITY * TRIAL_GRC_DENOMINATION,
      },
      // Return the magic token so the frontend can auto-login
      magicToken,
    });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to complete onboarding";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
