import { and, eq } from "drizzle-orm";
import { CheckCircle2, FileText, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { db, merchantServiceAgreementAcceptances } from "@/db";
import { getSession } from "@/lib/auth";
import { getMerchantAgreementPdfHref } from "@/lib/legal/merchant-agreement-pdf";
import { merchantServicesAgreement } from "@/lib/legal/merchant-services-agreement";
import {
  formatMarketLock360Amount,
  getMarketLock360MonthlyAmountCents,
} from "@/lib/marketlock360-pricing";
import { MerchantDashboardShell } from "../../merchant-dashboard-shell";
import { MarketLock360FlowSteps } from "../marketlock360-flow-steps";
import { MarketLockPaymentForm } from "./payment-form";

export const metadata: Metadata = {
  title: "MarketLock360 Payment | LOCAL City Places",
  description: "Complete the MarketLock360 monthly service period payment.",
};

interface CheckoutPageProps {
  searchParams: Promise<{
    agreementAcceptanceId?: string | string[];
  }>;
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function MerchantMarketLockCheckoutPage({
  searchParams,
}: CheckoutPageProps) {
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

  const params = await searchParams;
  const merchant = session.merchant;

  if (
    merchant.marketLockStatus !== "trial" &&
    merchant.marketLockStatus !== "pro"
  ) {
    redirect("/merchant/marketlock360");
  }

  const agreementAcceptanceId = getParam(params.agreementAcceptanceId);

  if (!agreementAcceptanceId) {
    redirect("/merchant/marketlock360/agreement");
  }

  const [agreementAcceptance] = await db
    .select({
      id: merchantServiceAgreementAcceptances.id,
      agreementVersion: merchantServiceAgreementAcceptances.agreementVersion,
      acceptedAt: merchantServiceAgreementAcceptances.acceptedAt,
      servicePeriodLabel:
        merchantServiceAgreementAcceptances.servicePeriodLabel,
      typedName: merchantServiceAgreementAcceptances.typedName,
    })
    .from(merchantServiceAgreementAcceptances)
    .where(
      and(
        eq(merchantServiceAgreementAcceptances.id, agreementAcceptanceId),
        eq(merchantServiceAgreementAcceptances.merchantId, session.merchant.id),
      ),
    )
    .limit(1);

  if (!agreementAcceptance) {
    redirect("/merchant/marketlock360/agreement");
  }

  const amountCents = getMarketLock360MonthlyAmountCents();
  const amountLabel = amountCents
    ? formatMarketLock360Amount(amountCents)
    : "Configured in Stripe";
  const signedAgreementPdfHref = getMerchantAgreementPdfHref(
    agreementAcceptance.id,
  );

  return (
    <MerchantDashboardShell>
      <div className="mx-auto max-w-[1180px] pb-8">
        <PageHeader
          title="Complete MarketLock360 payment"
          description={`Finish activation for ${merchant.businessName}. Your signed agreement is already recorded for ${agreementAcceptance.servicePeriodLabel}.`}
        />

        <MarketLock360FlowSteps
          agreementHref="/merchant/marketlock360/agreement"
          amountLabel={amountLabel}
          currentStep="payment"
          merchantName={merchant.businessName}
          servicePeriodLabel={agreementAcceptance.servicePeriodLabel}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <MarketLockPaymentForm
            agreementAcceptanceId={agreementAcceptance.id}
            amountLabel={amountLabel}
            merchantName={merchant.businessName}
            servicePeriodLabel={agreementAcceptance.servicePeriodLabel}
          />

          <aside className="space-y-5">
            <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm dark:border-[#21475d] dark:bg-[#08283a] dark:text-slate-100 dark:shadow-[0_14px_45px_rgba(0,0,0,0.18)]">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 ring-1 ring-orange-200 dark:bg-orange-500/12 dark:text-orange-400 dark:ring-orange-400/20">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold">Signed agreement</h2>
                  <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">
                    {merchantServicesAgreement.title}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4 border-t pt-4 text-sm dark:border-[#21475d]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-400">
                    Merchant
                  </p>
                  <p className="mt-1 font-semibold">{merchant.businessName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-400">
                    Service period
                  </p>
                  <p className="mt-1 font-semibold">
                    {agreementAcceptance.servicePeriodLabel}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-400">
                    One-time charge
                  </p>
                  <p className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {amountLabel}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">
                    Due for this monthly service period only.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-400">
                    Electronic signature
                  </p>
                  <p className="mt-1 font-semibold">
                    {agreementAcceptance.typedName}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">
                    {formatDate(agreementAcceptance.acceptedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-400">
                    Agreement version
                  </p>
                  <p className="mt-1 font-semibold">
                    {agreementAcceptance.agreementVersion}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="w-full dark:border-[#2a5368] dark:bg-[#092f44] dark:text-slate-100 dark:hover:bg-[#0b3850] dark:hover:text-white"
                >
                  <Link
                    href={signedAgreementPdfHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileText className="h-4 w-4" />
                    View signed PDF
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full dark:border-[#2a5368] dark:bg-[#092f44] dark:text-slate-100 dark:hover:bg-[#0b3850] dark:hover:text-white"
                >
                  <Link href="/merchant/marketlock360/agreement">
                    Review agreement
                  </Link>
                </Button>
              </div>
            </section>

            <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm dark:border-[#21475d] dark:bg-[#08283a] dark:text-slate-100 dark:shadow-[0_14px_45px_rgba(0,0,0,0.18)]">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-400/10 dark:text-cyan-300 dark:ring-cyan-300/20">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold">What happens next</h2>
                  <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">
                    This charge activates the current monthly service period.
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  "Stripe processes this month as a one-time payment.",
                  "The signed agreement and payment record stay linked internally.",
                  "Next month requires a new agreement and a new payment.",
                ].map((item) => (
                  <div key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </MerchantDashboardShell>
  );
}
