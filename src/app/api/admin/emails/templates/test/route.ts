import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  sendMagicLinkEmail,
  sendMerchantInviteEmail,
  sendMerchantRequestAdminNotificationEmail,
  sendMerchantRequestConfirmationEmail,
  sendMerchantWelcomeEmail,
  sendWelcomeEmail,
} from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId, to, params } = await request.json();

    if (!to || !templateId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    let success = false;

    switch (templateId) {
      case "magic-link":
        success = await sendMagicLinkEmail(
          to,
          params.token || "test-token-12345",
        );
        break;

      case "welcome":
        success = await sendWelcomeEmail(
          to,
          params.token || "test-token-12345",
        );
        break;

      case "merchant-request-confirmation":
        success = await sendMerchantRequestConfirmationEmail({
          email: to,
          ownerName: params.ownerName || "Jordan Owner",
          businessName: params.businessName || "Phoenix Demo Roofing",
          requestedCategory: params.requestedCategory || "Roofing",
          city: params.city || "Phoenix",
          state: params.state || "AZ",
          createdAt: params.createdAt
            ? new Date(params.createdAt)
            : new Date("2026-06-07T17:00:00.000Z"),
          reference: params.reference || "ABC12345",
        });
        break;

      case "merchant-request-admin-notification":
        success = await sendMerchantRequestAdminNotificationEmail({
          recipients: [to],
          ownerName: params.ownerName || "Jordan Owner",
          businessName: params.businessName || "Phoenix Demo Roofing",
          email: params.email || "owner@example.com",
          mobilePhone: params.mobilePhone || "4805550142",
          website: params.website || "https://example.com",
          businessAddress1: params.businessAddress1 || "123 E Demo Street",
          city: params.city || "Phoenix",
          state: params.state || "AZ",
          zipCode: params.zipCode || "85004",
          requestedCategory: params.requestedCategory || "Roofing",
          yearsInBusiness: params.yearsInBusiness || 8,
          shortDescription:
            params.shortDescription ||
            "Locally owned roofing team serving Phoenix metro homeowners with repair, replacement, and inspection services.",
          logoUrl: null,
          photoUrls: Array.from(
            { length: Number(params.photoCount || 0) },
            (_, index) => `https://example.com/photo-${index + 1}.jpg`,
          ),
          createdAt: params.createdAt
            ? new Date(params.createdAt)
            : new Date("2026-06-07T17:00:00.000Z"),
          reference: params.reference || "ABC12345",
        });
        break;

      case "merchant-invite":
        success = await sendMerchantInviteEmail({
          email: to,
          inviteUrl:
            params.inviteUrl || "https://localcityplaces.com/onboard/test",
          expiresInDays: params.expiresInDays || 7,
        });
        break;

      case "merchant-welcome":
        success = await sendMerchantWelcomeEmail({
          email: to,
          businessName: params.businessName || "Test Business",
          loginUrl: params.loginUrl || "https://localcityplaces.com/login",
        });
        break;

      default:
        return NextResponse.json(
          { error: "Unknown template" },
          { status: 400 },
        );
    }

    if (!success) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send test template error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
