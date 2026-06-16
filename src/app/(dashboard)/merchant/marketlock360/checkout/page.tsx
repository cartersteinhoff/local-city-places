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
import { isPaidMarketLock360Agreement } from "@/lib/marketlock360-checkout";
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

function formatRecordedAmount(
  amountCents: number | null,
  currency: string | null,
  fallback: string,
) {
  if (!amountCents) {
    return fallback;
  }

  return new Intl.NumberFormat("en-US", {
    currency: (currency || "usd").toUpperCase(),
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amountCents / 100);
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
      paidAt: merchantServiceAgreementAcceptances.paidAt,
      paymentAmountCents:
        merchantServiceAgreementAcceptances.paymentAmountCents,
      paymentCurrency: merchantServiceAgreementAcceptances.paymentCurrency,
      paymentStatus: merchantServiceAgreementAcceptances.paymentStatus,
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
  const paymentCompleted = isPaidMarketLock360Agreement(agreementAcceptance);
  const recordedAmountLabel = formatRecordedAmount(
    agreementAcceptance.paymentAmountCents,
    agreementAcceptance.paymentCurrency,
    amountLabel,
  );

  if (paymentCompleted) {
    const paidAtLabel = agreementAcceptance.paidAt
      ? formatDate(agreementAcceptance.paidAt)
      : "Recorded by Stripe";

    return (
      <MerchantDashboardShell>
        <div className="mx-auto max-w-[1180px] pb-8">
          <PageHeader
            title="Payment already complete"
            description={`MarketLock360 is active for ${merchant.businessName} for ${agreementAcceptance.servicePeriodLabel}.`}
          />

          <MarketLock360FlowSteps
            agreementCompleted
            agreementHref="/merchant/marketlock360/agreement"
            amountLabel={recordedAmountLabel}
            currentStep="payment"
            merchantName={merchant.businessName}
            paymentCompleted
            servicePeriodLabel={agreementAcceptance.servicePeriodLabel}
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <section className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm dark:border-[#21475d] dark:bg-[#08283a] dark:text-slate-100 dark:shadow-[0_20px_70px_rgba(0,0,0,0.22)]">
              <div className="border-b bg-emerald-50 px-5 py-6 dark:border-[#21475d] dark:bg-emerald-400/10 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-300/25">
                      <CheckCircle2 className="h-7 w-7" />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                        Receipt
                      </p>
                      <h2 className="mt-1 text-2xl font-bold tracking-tight">
                        MarketLock360 is active
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground dark:text-slate-300">
                        The agreement and one-time payment are recorded for this
                        monthly service period. No additional payment is needed
                        for this agreement.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-white px-4 py-3 text-left shadow-sm dark:border-emerald-300/20 dark:bg-[#061f2e] sm:text-right">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                      Paid
                    </p>
                    <p className="mt-1 text-3xl font-bold leading-none text-emerald-700 dark:text-emerald-300">
                      {recordedAmountLabel}
                    </p>
                  </div>
                </div>
              </div>

              <dl className="grid gap-0 border-b text-sm md:grid-cols-2 dark:border-[#21475d]">
                {[
                  ["Merchant", merchant.businessName],
                  ["Service period", agreementAcceptance.servicePeriodLabel],
                  ["Paid at", paidAtLabel],
                  [
                    "Payment status",
                    agreementAcceptance.paymentStatus || "paid",
                  ],
                  ["Electronic signature", agreementAcceptance.typedName],
                  ["Agreement version", agreementAcceptance.agreementVersion],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="border-b px-5 py-4 last:border-b-0 dark:border-[#21475d]"
                  >
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-400">
                      {label}
                    </dt>
                    <dd className="mt-1 font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-col gap-2 px-5 py-5 sm:flex-row sm:px-6">
                <Button asChild>
                  <Link href="/merchant/marketlock360">
                    <ShieldCheck className="h-4 w-4" />
                    MarketLock360 dashboard
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link
                    href={signedAgreementPdfHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileText className="h-4 w-4" />
                    View signed PDF
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/merchant/marketlock360/agreement">
                    Review agreement
                  </Link>
                </Button>
              </div>
            </section>

            <aside className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm dark:border-[#21475d] dark:bg-[#08283a] dark:text-slate-100">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-400/10 dark:text-cyan-300 dark:ring-cyan-300/20">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold">What happens next</h2>
                  <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">
                    This month is active. Next month, the merchant signs a new
                    agreement and submits a new one-time payment.
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  "The signed PDF remains available from the merchant dashboard.",
                  "Payment history shows this service period once the dashboard refreshes.",
                  "Future service periods require a new signature and payment.",
                ].map((item) => (
                  <div key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </MerchantDashboardShell>
    );
  }

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
          paymentCompleted={paymentCompleted}
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
