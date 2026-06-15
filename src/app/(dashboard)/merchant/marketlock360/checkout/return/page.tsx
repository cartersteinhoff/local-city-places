import { AlertCircle, ArrowLeft, CheckCircle2, CreditCard } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type Stripe from "stripe";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/lib/auth";
import {
  isMarketLock360CheckoutSession,
  isPaidMarketLock360CheckoutSession,
  syncMarketLock360CheckoutSession,
} from "@/lib/marketlock360-checkout";
import { getStripe } from "@/lib/stripe";
import { MerchantDashboardShell } from "../../../merchant-dashboard-shell";

export const metadata: Metadata = {
  title: "Payment Status | LOCAL City Places",
  description: "Review the MarketLock360 payment status.",
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

  return (
    <MerchantDashboardShell>
      <div className="mx-auto max-w-[860px] pb-8">
        <PageHeader
          title={statusLabel}
          description={
            isComplete
              ? `MarketLock360 is active for ${merchant.businessName}.`
              : "Review the payment status below."
          }
        />

        <section className="rounded-lg border bg-card p-6">
          <div className="flex items-start gap-4">
            <span
              className={
                isComplete
                  ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-500"
                  : "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500"
              }
            >
              {isComplete ? (
                <CheckCircle2 className="h-7 w-7" />
              ) : (
                <AlertCircle className="h-7 w-7" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold">{statusLabel}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {error ||
                  (isComplete
                    ? "Stripe confirmed the checkout session and the merchant status has been updated."
                    : "The checkout session did not complete. You can return to payment and try again.")}
              </p>

              {checkoutSession && (
                <dl className="mt-5 grid gap-4 border-t pt-5 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Checkout session
                    </dt>
                    <dd className="mt-1 truncate font-semibold">
                      {checkoutSession.id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Payment status
                    </dt>
                    <dd className="mt-1 font-semibold">
                      {checkoutSession.payment_status}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Merchant
                    </dt>
                    <dd className="mt-1 font-semibold">
                      {merchant.businessName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Customer email
                    </dt>
                    <dd className="mt-1 truncate font-semibold">
                      {customerEmail || "Not provided"}
                    </dd>
                  </div>
                </dl>
              )}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button asChild>
                  <Link href="/merchant/marketlock360">
                    <CreditCard className="h-4 w-4" />
                    MarketLock360 dashboard
                  </Link>
                </Button>
                {!isComplete &&
                  checkoutSession?.metadata?.agreementAcceptanceId && (
                    <Button asChild variant="outline">
                      <Link
                        href={`/merchant/marketlock360/checkout?agreementAcceptanceId=${encodeURIComponent(checkoutSession.metadata.agreementAcceptanceId)}`}
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
            </div>
          </div>
        </section>
      </div>
    </MerchantDashboardShell>
  );
}
