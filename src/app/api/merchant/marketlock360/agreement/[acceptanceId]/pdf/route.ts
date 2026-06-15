import { and, eq } from "drizzle-orm";
import { db, merchantServiceAgreementAcceptances } from "@/db";
import { getSession } from "@/lib/auth";
import { generateMerchantAgreementPdf } from "@/lib/legal/merchant-agreement-pdf";

interface AgreementPdfRouteContext {
  params: Promise<{
    acceptanceId: string;
  }>;
}

function getAgreementTextSnapshot(agreementTextSnapshot: string) {
  const executionRecordMarker = "\n\nEXECUTION RECORD";
  const executionRecordIndex = agreementTextSnapshot.indexOf(
    executionRecordMarker,
  );

  return executionRecordIndex >= 0
    ? agreementTextSnapshot.slice(0, executionRecordIndex)
    : agreementTextSnapshot;
}

function getPdfFileName(acceptanceId: string) {
  return `marketlock360-agreement-${acceptanceId}.pdf`;
}

export async function GET(
  _request: Request,
  context: AgreementPdfRouteContext,
) {
  const session = await getSession();

  if (
    !session ||
    (session.user.role !== "merchant" && session.user.role !== "admin")
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.merchant) {
    return Response.json({ error: "Merchant not found" }, { status: 404 });
  }

  const { acceptanceId } = await context.params;
  const [agreementAcceptance] = await db
    .select({
      id: merchantServiceAgreementAcceptances.id,
      agreementContentHash:
        merchantServiceAgreementAcceptances.agreementContentHash,
      agreementTextSnapshot:
        merchantServiceAgreementAcceptances.agreementTextSnapshot,
      agreementTitle: merchantServiceAgreementAcceptances.agreementTitle,
      agreementVersion: merchantServiceAgreementAcceptances.agreementVersion,
      acceptedAt: merchantServiceAgreementAcceptances.acceptedAt,
      ipAddress: merchantServiceAgreementAcceptances.ipAddress,
      servicePeriodLabel:
        merchantServiceAgreementAcceptances.servicePeriodLabel,
      typedName: merchantServiceAgreementAcceptances.typedName,
      userAgent: merchantServiceAgreementAcceptances.userAgent,
    })
    .from(merchantServiceAgreementAcceptances)
    .where(
      and(
        eq(merchantServiceAgreementAcceptances.id, acceptanceId),
        eq(merchantServiceAgreementAcceptances.merchantId, session.merchant.id),
      ),
    )
    .limit(1);

  if (!agreementAcceptance) {
    return Response.json({ error: "Agreement not found" }, { status: 404 });
  }

  const pdfBuffer = generateMerchantAgreementPdf({
    acceptanceId: agreementAcceptance.id,
    merchantName: session.merchant.businessName,
    typedName: agreementAcceptance.typedName,
    agreementVersion: agreementAcceptance.agreementVersion,
    agreementTitle: agreementAcceptance.agreementTitle,
    agreementText: getAgreementTextSnapshot(
      agreementAcceptance.agreementTextSnapshot,
    ),
    servicePeriodLabel: agreementAcceptance.servicePeriodLabel,
    acceptedAt: agreementAcceptance.acceptedAt,
    agreementContentHash: agreementAcceptance.agreementContentHash,
    ipAddress: agreementAcceptance.ipAddress,
    userAgent: agreementAcceptance.userAgent,
  });

  return new Response(pdfBuffer, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="${getPdfFileName(agreementAcceptance.id)}"`,
      "Content-Type": "application/pdf",
    },
  });
}
