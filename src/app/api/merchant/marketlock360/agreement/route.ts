import { createHash, randomUUID } from "node:crypto";
import { and, desc, eq, gt, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, merchantServiceAgreementAcceptances } from "@/db";
import { getSession } from "@/lib/auth";
import {
  generateMerchantAgreementPdf,
  getMerchantAgreementPdfHref,
} from "@/lib/legal/merchant-agreement-pdf";
import { getMerchantAgreementServicePeriod } from "@/lib/legal/merchant-service-period";
import {
  getMerchantServicesAgreementText,
  merchantServicesAgreement,
} from "@/lib/legal/merchant-services-agreement";

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip");

  return ipAddress ? ipAddress.slice(0, 45) : null;
}

function getCheckoutUrl(agreementAcceptanceId: string) {
  return (
    process.env.MARKETLOCK360_STRIPE_CHECKOUT_URL ||
    `/merchant/marketlock360/checkout?agreementAcceptanceId=${encodeURIComponent(agreementAcceptanceId)}`
  );
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

    if (
      session.merchant.marketLockStatus !== "trial" &&
      session.merchant.marketLockStatus !== "pro"
    ) {
      return NextResponse.json(
        { error: "Trial request must be accepted before signing." },
        { status: 403 },
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

    const now = new Date();
    const servicePeriod = getMerchantAgreementServicePeriod(now);
    const [existingAcceptance] = await db
      .select({
        id: merchantServiceAgreementAcceptances.id,
      })
      .from(merchantServiceAgreementAcceptances)
      .where(
        and(
          eq(
            merchantServiceAgreementAcceptances.merchantId,
            session.merchant.id,
          ),
          eq(
            merchantServiceAgreementAcceptances.agreementVersion,
            merchantServicesAgreement.version,
          ),
          lte(merchantServiceAgreementAcceptances.servicePeriodStart, now),
          gt(merchantServiceAgreementAcceptances.servicePeriodEnd, now),
        ),
      )
      .orderBy(desc(merchantServiceAgreementAcceptances.acceptedAt))
      .limit(1);

    if (existingAcceptance) {
      return NextResponse.json({
        success: true,
        alreadyAccepted: true,
        agreementAcceptanceId: existingAcceptance.id,
        agreementPdfUrl: getMerchantAgreementPdfHref(existingAcceptance.id),
        redirectUrl: getCheckoutUrl(existingAcceptance.id),
      });
    }

    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get("user-agent");
    const legalAgreementText = getMerchantServicesAgreementText();
    const agreementTextSnapshot = [
      legalAgreementText,
      "EXECUTION RECORD",
      `Merchant: ${session.merchant.businessName}`,
      `Service period: ${servicePeriod.label}`,
      `Accepted by electronic signature: ${typedName}`,
      `Accepted at: ${now.toISOString()}`,
    ].join("\n\n");
    const agreementContentHash = createHash("sha256")
      .update(agreementTextSnapshot)
      .digest("hex");
    const acceptanceId = randomUUID();
    generateMerchantAgreementPdf({
      acceptanceId,
      merchantName: session.merchant.businessName,
      typedName,
      agreementVersion: merchantServicesAgreement.version,
      agreementTitle: merchantServicesAgreement.title,
      agreementText: legalAgreementText,
      servicePeriodLabel: servicePeriod.label,
      acceptedAt: now,
      agreementContentHash,
      ipAddress,
      userAgent,
    });

    await db.insert(merchantServiceAgreementAcceptances).values({
      id: acceptanceId,
      merchantId: session.merchant.id,
      userId: session.user.id,
      agreementVersion: merchantServicesAgreement.version,
      agreementTitle: merchantServicesAgreement.title,
      agreementContentHash,
      agreementTextSnapshot,
      typedName,
      servicePeriodStart: servicePeriod.startsAt,
      servicePeriodEnd: servicePeriod.endsAt,
      servicePeriodLabel: servicePeriod.label,
      agreementPdfUrl: null,
      agreementPdfPath: null,
      agreementPdfGeneratedAt: now,
      ipAddress,
      userAgent,
      acceptedAt: now,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      agreementAcceptanceId: acceptanceId,
      agreementPdfUrl: getMerchantAgreementPdfHref(acceptanceId),
      redirectUrl: getCheckoutUrl(acceptanceId),
    });
  } catch (error) {
    console.error("MarketLock360 agreement acceptance error:", error);
    return NextResponse.json(
      { error: "Failed to accept agreement" },
      { status: 500 },
    );
  }
}
