import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db, merchantServiceAgreementAcceptances } from "@/db";
import { getSession } from "@/lib/auth";
import {
  getMerchantServicesAgreementText,
  merchantServicesAgreement,
} from "@/lib/legal/merchant-services-agreement";

const fallbackCheckoutUrl = "/merchant?agreement=accepted";

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip");

  return ipAddress ? ipAddress.slice(0, 45) : null;
}

function getCheckoutUrl() {
  return process.env.MARKETLOCK360_STRIPE_CHECKOUT_URL || fallbackCheckoutUrl;
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (
      !session ||
      (session.user.role !== "merchant" && session.user.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 },
      );
    }

    const body = (await request.json().catch(() => null)) as {
      accepted?: unknown;
      typedName?: unknown;
    } | null;

    const typedName =
      typeof body?.typedName === "string" ? body.typedName.trim() : "";

    if (body?.accepted !== true) {
      return NextResponse.json(
        { error: "Agreement must be accepted" },
        { status: 400 },
      );
    }

    if (typedName.length < 2) {
      return NextResponse.json(
        { error: "Electronic signature is required" },
        { status: 400 },
      );
    }

    if (typedName.length > 255) {
      return NextResponse.json(
        { error: "Electronic signature is too long" },
        { status: 400 },
      );
    }

    const agreementTextSnapshot = getMerchantServicesAgreementText();
    const agreementContentHash = createHash("sha256")
      .update(agreementTextSnapshot)
      .digest("hex");
    const now = new Date();

    const [acceptance] = await db
      .insert(merchantServiceAgreementAcceptances)
      .values({
        merchantId: session.merchant.id,
        userId: session.user.id,
        agreementVersion: merchantServicesAgreement.version,
        agreementTitle: merchantServicesAgreement.title,
        agreementContentHash,
        agreementTextSnapshot,
        typedName,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent"),
        acceptedAt: now,
        createdAt: now,
      })
      .returning({ id: merchantServiceAgreementAcceptances.id });

    return NextResponse.json({
      success: true,
      agreementAcceptanceId: acceptance.id,
      redirectUrl: getCheckoutUrl(),
    });
  } catch (error) {
    console.error("MarketLock360 agreement acceptance error:", error);
    return NextResponse.json(
      { error: "Failed to accept agreement" },
      { status: 500 },
    );
  }
}
