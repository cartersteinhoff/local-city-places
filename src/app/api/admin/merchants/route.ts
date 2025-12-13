import { NextRequest, NextResponse } from "next/server";
import { getSession, createMagicLinkToken } from "@/lib/auth";
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
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      email,
      businessName,
      city,
      state,
      categoryId,
      phone,
      website,
      description,
      logoUrl,
      googlePlaceId,
      sendWelcomeEmail = true,
    } = body;

    // Validate required fields
    if (!email || !businessName) {
      return NextResponse.json(
        { error: "Email and business name are required" },
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
      state,
      categoryId,
      phone,
      website,
      description,
      logoUrl,
      googlePlaceId,
      createdBy: session.user.id,
    });

    // Send welcome email if requested
    let emailSent = false;
    if (sendWelcomeEmail) {
      // Create magic link for the merchant to log in
      const magicToken = await createMagicLinkToken(email);
      const loginUrl = `${APP_URL}/api/auth/verify?token=${magicToken}`;

      emailSent = await sendMerchantWelcomeEmail({
        email,
        businessName,
        loginUrl,
        trialGrcCount: TRIAL_GRC_QUANTITY,
        trialGrcDenomination: TRIAL_GRC_DENOMINATION,
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
      },
      merchant: {
        id: result.merchant.id,
        businessName: result.merchant.businessName,
        city: result.merchant.city,
      },
      trialGrcs: {
        quantity: TRIAL_GRC_QUANTITY,
        denomination: TRIAL_GRC_DENOMINATION,
        totalValue: TRIAL_GRC_QUANTITY * TRIAL_GRC_DENOMINATION,
      },
      emailSent,
    });
  } catch (error) {
    console.error("Error creating merchant:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create merchant";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
