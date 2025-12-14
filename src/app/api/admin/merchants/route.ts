import { NextRequest, NextResponse } from "next/server";
import { getSession, createMagicLinkToken } from "@/lib/auth";
import {
  createMerchantWithTrialGrcs,
  validateEmailForMerchant,
  TRIAL_GRC_QUANTITY,
  TRIAL_GRC_DENOMINATIONS,
  type TrialGrcDenomination,
} from "@/lib/merchant-onboarding";
import { sendMerchantWelcomeEmail, sendMerchantWelcomeNoTrialEmail } from "@/lib/email";

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
      trialGrcDenomination, // number | null - required field, null means no trial GRCs
    } = body;

    // Validate required fields
    if (!email || !businessName) {
      return NextResponse.json(
        { error: "Email and business name are required" },
        { status: 400 }
      );
    }

    // Validate trialGrcDenomination is provided (required field)
    if (trialGrcDenomination === undefined) {
      return NextResponse.json(
        { error: "Trial GRC denomination selection is required" },
        { status: 400 }
      );
    }

    // Validate denomination is valid (if not null)
    if (trialGrcDenomination !== null && !TRIAL_GRC_DENOMINATIONS.includes(trialGrcDenomination)) {
      return NextResponse.json(
        { error: "Invalid trial GRC denomination" },
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

    // Create merchant (with or without trial GRCs based on denomination)
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
      trialGrcDenomination: trialGrcDenomination as TrialGrcDenomination | null,
    });

    // Send welcome email if requested
    let emailSent = false;
    if (sendWelcomeEmail) {
      // Create magic link for the merchant to log in
      const magicToken = await createMagicLinkToken(email);
      const loginUrl = `${APP_URL}/api/auth/verify?token=${magicToken}`;

      if (result.trialPurchase) {
        // Send welcome email with trial GRC info
        emailSent = await sendMerchantWelcomeEmail({
          email,
          businessName,
          loginUrl,
          trialGrcCount: TRIAL_GRC_QUANTITY,
          trialGrcDenomination: result.trialPurchase.denomination,
        });
      } else {
        // Send welcome email without trial GRC info (they'll be set up later)
        emailSent = await sendMerchantWelcomeNoTrialEmail({
          email,
          businessName,
          loginUrl,
        });
      }
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
      trialGrcs: result.trialPurchase
        ? {
            quantity: TRIAL_GRC_QUANTITY,
            denomination: result.trialPurchase.denomination,
            totalValue: TRIAL_GRC_QUANTITY * result.trialPurchase.denomination,
          }
        : null,
      emailSent,
    });
  } catch (error) {
    console.error("Error creating merchant:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create merchant";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
