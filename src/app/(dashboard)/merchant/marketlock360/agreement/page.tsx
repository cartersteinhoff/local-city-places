import { and, desc, eq, gt, lte } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { db, merchantServiceAgreementAcceptances } from "@/db";
import { getSession } from "@/lib/auth";
import { getMerchantAgreementPdfHref } from "@/lib/legal/merchant-agreement-pdf";
import { getMerchantAgreementServicePeriod } from "@/lib/legal/merchant-service-period";
import { merchantServicesAgreement } from "@/lib/legal/merchant-services-agreement";
import { isPaidMarketLock360Agreement } from "@/lib/marketlock360-checkout";
import {
  formatMarketLock360Amount,
  getMarketLock360MonthlyAmountCents,
} from "@/lib/marketlock360-pricing";
import { MerchantDashboardShell } from "../../merchant-dashboard-shell";
import { MarketLock360FlowSteps } from "../marketlock360-flow-steps";
import { AgreementSigningExperience } from "./agreement-signing-experience";

export const metadata: Metadata = {
  title: "Merchant Services Agreement | LOCAL City Places",
  description:
    "Review and accept the MARKETLOCK360 monthly merchant services agreement.",
};

export default async function MerchantMarketLockAgreementPage() {
  const session = await getSession();

  if (
    !session ||
    (session.user.role !== "merchant" && session.user.role !== "admin")
  ) {
    redirect("/");
  }

  if (!session.merchant) {
    redirect("/merchant");
  }

  const merchant = session.merchant;

  if (
    merchant.marketLockStatus !== "trial" &&
    merchant.marketLockStatus !== "pro"
  ) {
    redirect("/merchant/marketlock360");
  }

  const now = new Date();
  const currentServicePeriod = getMerchantAgreementServicePeriod(now);
  const [signedAgreement] = await db
    .select({
      id: merchantServiceAgreementAcceptances.id,
      agreementVersion: merchantServiceAgreementAcceptances.agreementVersion,
      acceptedAt: merchantServiceAgreementAcceptances.acceptedAt,
      paidAt: merchantServiceAgreementAcceptances.paidAt,
      paymentStatus: merchantServiceAgreementAcceptances.paymentStatus,
      servicePeriodLabel:
        merchantServiceAgreementAcceptances.servicePeriodLabel,
      typedName: merchantServiceAgreementAcceptances.typedName,
    })
    .from(merchantServiceAgreementAcceptances)
    .where(
      and(
        eq(merchantServiceAgreementAcceptances.merchantId, merchant.id),
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

  const servicePeriodLabel =
    signedAgreement?.servicePeriodLabel ?? currentServicePeriod.label;
  const amountCents = getMarketLock360MonthlyAmountCents();
  const monthlyPaymentLabel = amountCents
    ? formatMarketLock360Amount(amountCents)
    : null;
  const paymentCompleted = signedAgreement
    ? isPaidMarketLock360Agreement(signedAgreement)
    : false;
  const signedAgreementView = signedAgreement
    ? {
        acceptedAtIso: signedAgreement.acceptedAt.toISOString(),
        agreementPdfUrl: getMerchantAgreementPdfHref(signedAgreement.id),
        agreementVersion: signedAgreement.agreementVersion,
        id: signedAgreement.id,
        paidAtIso: signedAgreement.paidAt?.toISOString() ?? null,
        paymentCompleted,
        servicePeriodLabel: signedAgreement.servicePeriodLabel,
        typedName: signedAgreement.typedName,
      }
    : null;

  return (
    <MerchantDashboardShell>
      <div className="mx-auto max-w-[1180px] pb-24 lg:pb-0">
        <PageHeader
          title={
            paymentCompleted
              ? "Agreement and payment complete"
              : signedAgreement
                ? "Agreement already signed"
                : "Review and sign your monthly agreement"
          }
          description={
            paymentCompleted
              ? `${merchant.businessName} is active for ${servicePeriodLabel}. The signed PDF and payment record are saved for this monthly service period.`
              : signedAgreement
                ? `${merchant.businessName} has already signed the MARKETLOCK360 agreement for ${servicePeriodLabel}. Continue to payment or view the signed PDF copy.`
                : `This agreement covers ${merchant.businessName} for ${servicePeriodLabel}. A signed PDF copy is saved after acceptance.`
          }
        />

        <MarketLock360FlowSteps
          agreementCompleted={!!signedAgreement}
          amountLabel={monthlyPaymentLabel}
          currentStep="agreement"
          merchantName={merchant.businessName}
          paymentCompleted={paymentCompleted}
          servicePeriodLabel={servicePeriodLabel}
        />

        <AgreementSigningExperience
          agreement={merchantServicesAgreement}
          agreementVersion={merchantServicesAgreement.version}
          merchantName={merchant.businessName}
          monthlyPaymentLabel={monthlyPaymentLabel}
          servicePeriodLabel={servicePeriodLabel}
          signedAgreement={signedAgreementView}
        />
      </div>
    </MerchantDashboardShell>
  );
}
