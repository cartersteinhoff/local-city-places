import { NextRequest, NextResponse } from "next/server";
import { getSession, createMagicLinkToken } from "@/lib/auth";
import { db, merchants, users } from "@/db";
import { eq } from "drizzle-orm";
import {
  setTrialGrcsForMerchant,
  TRIAL_GRC_QUANTITY,
  TRIAL_GRC_DENOMINATIONS,
  type TrialGrcDenomination,
} from "@/lib/merchant-onboarding";
import { sendTrialGrcsActivatedEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { merchantId } = await params;
    const body = await request.json();
    const { denomination } = body;

    // Validate denomination
    if (!denomination || !TRIAL_GRC_DENOMINATIONS.includes(denomination)) {
      return NextResponse.json(
        { error: "Invalid denomination. Must be one of: 25, 50, 75, 100" },
        { status: 400 }
      );
    }

    // Get merchant details for email
    const [merchant] = await db
      .select({
        id: merchants.id,
        businessName: merchants.businessName,
        userId: merchants.userId,
      })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // Check if merchant has a user account (page-only merchants don't)
    const userId = merchant.userId;
    if (!userId) {
      return NextResponse.json(
        { error: "This merchant does not have a user account. Trial GRCs can only be given to merchants with accounts." },
        { status: 400 }
      );
    }

    // Get user email
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Merchant user not found" },
        { status: 404 }
      );
    }

    // Set trial GRCs
    const trialPurchase = await setTrialGrcsForMerchant(
      merchantId,
      denomination as TrialGrcDenomination,
      session.user.id
    );

    // Send notification email
    const magicToken = await createMagicLinkToken(user.email);
    const loginUrl = `${APP_URL}/api/auth/verify?token=${magicToken}`;

    await sendTrialGrcsActivatedEmail({
      email: user.email,
      businessName: merchant.businessName,
      loginUrl,
      trialGrcCount: TRIAL_GRC_QUANTITY,
      trialGrcDenomination: denomination,
    });

    return NextResponse.json({
      success: true,
      trialPurchase: {
        id: trialPurchase.id,
        denomination: trialPurchase.denomination,
        quantity: trialPurchase.quantity,
        totalValue: TRIAL_GRC_QUANTITY * denomination,
      },
      emailSent: true,
    });
  } catch (error) {
    console.error("Error setting trial GRCs:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to set trial GRCs";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
