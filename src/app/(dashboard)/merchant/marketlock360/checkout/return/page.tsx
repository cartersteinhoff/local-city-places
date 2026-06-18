import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  FileText,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type Stripe from "stripe";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/lib/auth";
import { getMerchantAgreementPdfHref } from "@/lib/legal/merchant-agreement-pdf";
import {
  isMarketLock360CheckoutSession,
  isPaidMarketLock360CheckoutSession,
  syncMarketLock360CheckoutSession,
} from "@/lib/marketlock360-checkout";
import { getStripe } from "@/lib/stripe";
import { MerchantDashboardShell } from "../../../merchant-dashboard-shell";

export const metadata: Metadata = {
  title: "MarketLock360 Payment Complete | LOCAL City Places",
  description: "Review the MarketLock360 payment confirmation.",
};

interface CheckoutReturnPageProps {
  searchParams: Promise<{
    session_id?: string | string[];
  }>;
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getDisplayStatus(
  status?: string | null,
  paymentStatus?: string | null,
) {
  if (status === "complete" && paymentStatus === "paid") {
    return "Payment complete";
  }

  if (status === "complete" && paymentStatus === "no_payment_required") {
    return "Checkout complete";
  }

  if (status === "open") {
    return "Payment not finished";
  }

  if (status === "expired") {
    return "Checkout expired";
  }

  return "Payment status unavailable";
}

function formatCheckoutAmount(
  amountCents?: number | null,
  currency?: string | null,
) {
  if (!amountCents) {
    return "Recorded by Stripe";
  }

  return new Intl.NumberFormat("en-US", {
    currency: (currency || "usd").toUpperCase(),
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amountCents / 100);
}

export default async function MerchantMarketLockCheckoutReturnPage({
  searchParams,
}: CheckoutReturnPageProps) {
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
  const stripeSessionId = getParam(params.session_id);
  const merchant = session.merchant;
  let checkoutSession: Stripe.Checkout.Session | null = null;
  let error: string | null = null;

  if (!stripeSessionId) {
    error = "Checkout session ID is missing.";
  } else {
    try {
      checkoutSession =
        await getStripe().checkout.sessions.retrieve(stripeSessionId);

      if (checkoutSession.metadata?.merchantId !== merchant.id) {
        checkoutSession = null;
        error = "Checkout session was not found for this merchant.";
      } else if (!isMarketLock360CheckoutSession(checkoutSession)) {
        checkoutSession = null;
        error = "Checkout session was not found for MarketLock360.";
      }
    } catch (retrieveError) {
      console.error("MarketLock360 checkout return error:", retrieveError);
      error = "Unable to retrieve the checkout session.";
    }
  }

  const isComplete = checkoutSession
    ? isPaidMarketLock360CheckoutSession(checkoutSession)
    : false;

  if (isComplete && checkoutSession) {
    await syncMarketLock360CheckoutSession(checkoutSession);
  }

  const statusLabel = getDisplayStatus(
    checkoutSession?.status,
    checkoutSession?.payment_status,
  );
  const customerEmail =
    checkoutSession?.customer_details?.email ||
    checkoutSession?.customer_email ||
    null;
  const agreementAcceptanceId =
    checkoutSession?.metadata?.agreementAcceptanceId || null;
  const servicePeriodLabel =
    checkoutSession?.metadata?.servicePeriod || "Current service period";
  const amountLabel = formatCheckoutAmount(
    checkoutSession?.amount_total,
    checkoutSession?.currency,
  );

  return (
    <MerchantDashboardShell>
      <div className="mx-auto max-w-[960px] pb-8">
        <PageHeader
          title={isComplete ? "Payment complete" : statusLabel}
          description={
            isComplete
              ? `MarketLock360 is active for ${merchant.businessName} for ${servicePeriodLabel}.`
              : "The payment did not finish. Review the status and return to checkout if needed."
          }
        />

        <section className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm dark:border-[#21475d] dark:bg-[#08283a] dark:text-slate-100">
          <div
            className={
              isComplete
                ? "border-b bg-emerald-50 px-5 py-6 dark:border-[#21475d] dark:bg-emerald-400/10 sm:px-6"
                : "border-b bg-orange-50 px-5 py-6 dark:border-[#21475d] dark:bg-orange-500/10 sm:px-6"
            }
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <span
                  className={
                    isComplete
                      ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-300/25"
                      : "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-300/25"
                  }
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-7 w-7" />
                  ) : (
                    <AlertCircle className="h-7 w-7" />
                  )}
                </span>
                <div>
                  <p
                    className={
                      isComplete
                        ? "text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300"
                        : "text-xs font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300"
                    }
                  >
                    {isComplete ? "Receipt" : "Action needed"}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight">
                    {isComplete
                      ? "MarketLock360 is active"
                      : "Payment was not completed"}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground dark:text-slate-300">
                    {error ||
                      (isComplete
                        ? "The signed agreement and one-time payment are recorded for this monthly service period."
                        : "You can return to payment and finish the one-time charge for this service period.")}
                  </p>
                </div>
              </div>
              {isComplete && (
                <div className="rounded-lg border border-emerald-200 bg-white px-4 py-3 text-left shadow-sm dark:border-emerald-300/20 dark:bg-[#061f2e] sm:text-right">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    Paid
                  </p>
                  <p className="mt-1 text-3xl font-bold leading-none text-emerald-700 dark:text-emerald-300">
                    {amountLabel}
                  </p>
                </div>
              )}
            </div>
          </div>

          {checkoutSession && (
            <dl className="grid gap-0 border-b text-sm md:grid-cols-2 dark:border-[#21475d]">
              {[
                ["Merchant", merchant.businessName],
                ["Service period", servicePeriodLabel],
                ["Amount", amountLabel],
                ["Payment status", checkoutSession.payment_status],
                ["Customer email", customerEmail || "Not provided"],
                [
                  "Record status",
                  isComplete ? "Agreement and payment saved" : statusLabel,
                ],
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
          )}

          {isComplete && (
            <div className="border-b bg-muted/25 px-5 py-5 dark:border-[#21475d] dark:bg-[#061f2e] sm:px-6">
              <div className="grid gap-4 text-sm md:grid-cols-3">
                {[
                  [
                    "Signed agreement saved",
                    "The executed agreement remains available as a PDF.",
                  ],
                  [
                    "Payment history updated",
                    "The dashboard lists the payment and signed agreement together.",
                  ],
                  [
                    "Monthly renewal is manual",
                    "Next month requires a new agreement and one-time payment.",
                  ],
                ].map(([title, description]) => (
                  <div key={title} className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground dark:text-slate-400">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 px-5 py-5 sm:flex-row sm:px-6">
            <Button asChild>
              <Link href="/merchant/marketlock360">
                <CreditCard className="h-4 w-4" />
                MarketLock360 dashboard
              </Link>
            </Button>
            {isComplete && agreementAcceptanceId && (
              <Button asChild variant="outline">
                <Link
                  href={getMerchantAgreementPdfHref(agreementAcceptanceId)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileText className="h-4 w-4" />
                  View signed PDF
                </Link>
              </Button>
            )}
            {!isComplete && agreementAcceptanceId && (
              <Button asChild variant="outline">
                <Link
                  href={`/merchant/marketlock360/checkout?agreementAcceptanceId=${encodeURIComponent(agreementAcceptanceId)}`}
                >
                  Return to payment
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/merchant">
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </MerchantDashboardShell>
  );
}
