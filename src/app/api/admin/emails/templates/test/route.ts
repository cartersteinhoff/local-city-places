import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  sendMagicLinkEmail,
  sendWelcomeEmail,
  sendGrcIssuedEmail,
  sendMerchantInviteEmail,
  sendMerchantWelcomeEmail,
  sendMerchantWelcomeNoTrialEmail,
  sendTrialGrcsActivatedEmail,
} from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId, to, params } = await request.json();

    if (!to || !templateId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let success = false;

    switch (templateId) {
      case "magic-link":
        success = await sendMagicLinkEmail(to, params.token || "test-token-12345");
        break;

      case "welcome":
        success = await sendWelcomeEmail(to, params.token || "test-token-12345");
        break;

      case "grc-issued":
        success = await sendGrcIssuedEmail({
          recipientEmail: to,
          recipientName: params.recipientName || "Test User",
          merchantName: params.merchantName || "Test Business",
          denomination: params.denomination || 120,
          totalMonths: params.totalMonths || 12,
          claimUrl: params.claimUrl || "https://localcityplaces.com/claim/test",
        });
        break;

      case "merchant-invite":
        success = await sendMerchantInviteEmail({
          email: to,
          inviteUrl: params.inviteUrl || "https://localcityplaces.com/onboard/test",
          expiresInDays: params.expiresInDays || 7,
        });
        break;

      case "merchant-welcome":
        success = await sendMerchantWelcomeEmail({
          email: to,
          businessName: params.businessName || "Test Business",
          loginUrl: params.loginUrl || "https://localcityplaces.com/login",
          trialGrcCount: params.trialGrcCount || 10,
          trialGrcDenomination: params.trialGrcDenomination || 120,
        });
        break;

      case "merchant-welcome-no-trial":
        success = await sendMerchantWelcomeNoTrialEmail({
          email: to,
          businessName: params.businessName || "Test Business",
          loginUrl: params.loginUrl || "https://localcityplaces.com/login",
        });
        break;

      case "trial-grcs-activated":
        success = await sendTrialGrcsActivatedEmail({
          email: to,
          businessName: params.businessName || "Test Business",
          loginUrl: params.loginUrl || "https://localcityplaces.com/login",
          trialGrcCount: params.trialGrcCount || 10,
          trialGrcDenomination: params.trialGrcDenomination || 120,
        });
        break;

      default:
        return NextResponse.json({ error: "Unknown template" }, { status: 400 });
    }

    if (!success) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send test template error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
