import { and, eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db, merchantServiceAgreementAcceptances, merchants } from "@/db";

type FulfillmentResult =
  | {
      fulfilled: true;
      agreementAcceptanceId: string;
      merchantId: string;
    }
  | {
      fulfilled: false;
      reason:
        | "agreement_not_found"
        | "missing_metadata"
        | "not_marketlock360"
        | "not_paid";
    };

type MarketLock360AgreementPaymentState = {
  paidAt?: Date | null;
  paymentStatus?: string | null;
};

function getPaymentIntentId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id || null;
}

function getCheckoutPaymentStatus(session: Stripe.Checkout.Session) {
  if (session.status === "expired") {
    return "expired";
  }

  return session.payment_status;
}

export function isMarketLock360CheckoutSession(
  session: Stripe.Checkout.Session,
) {
  return session.metadata?.service === "marketlock360";
}

export function isPaidMarketLock360CheckoutSession(
  session: Stripe.Checkout.Session,
) {
  return (
    isMarketLock360CheckoutSession(session) &&
    session.status === "complete" &&
    (session.payment_status === "paid" ||
      session.payment_status === "no_payment_required")
  );
}

export function isPaidMarketLock360Agreement(
  agreement: MarketLock360AgreementPaymentState,
) {
  return (
    Boolean(agreement.paidAt) ||
    agreement.paymentStatus === "paid" ||
    agreement.paymentStatus === "no_payment_required"
  );
}

export async function syncMarketLock360CheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<FulfillmentResult> {
  if (!isMarketLock360CheckoutSession(session)) {
    return { fulfilled: false, reason: "not_marketlock360" };
  }

  const merchantId = session.metadata?.merchantId || "";
  const agreementAcceptanceId = session.metadata?.agreementAcceptanceId || "";

  if (!merchantId || !agreementAcceptanceId) {
    return { fulfilled: false, reason: "missing_metadata" };
  }

  const [agreementAcceptance] = await db
    .select({
      id: merchantServiceAgreementAcceptances.id,
      paidAt: merchantServiceAgreementAcceptances.paidAt,
      paymentAmountCents:
        merchantServiceAgreementAcceptances.paymentAmountCents,
      paymentCurrency: merchantServiceAgreementAcceptances.paymentCurrency,
    })
    .from(merchantServiceAgreementAcceptances)
    .where(
      and(
        eq(merchantServiceAgreementAcceptances.id, agreementAcceptanceId),
        eq(merchantServiceAgreementAcceptances.merchantId, merchantId),
      ),
    )
    .limit(1);

  if (!agreementAcceptance) {
    return { fulfilled: false, reason: "agreement_not_found" };
  }

  const isPaid = isPaidMarketLock360CheckoutSession(session);
  const now = new Date();

  await db
    .update(merchantServiceAgreementAcceptances)
    .set({
      checkoutSessionId: session.id,
      paymentAmountCents:
        session.amount_total ?? agreementAcceptance.paymentAmountCents,
      paymentCurrency: session.currency ?? agreementAcceptance.paymentCurrency,
      paymentStatus: getCheckoutPaymentStatus(session),
      stripePaymentIntentId: getPaymentIntentId(session),
      ...(isPaid ? { paidAt: agreementAcceptance.paidAt ?? now } : {}),
    })
    .where(
      and(
        eq(merchantServiceAgreementAcceptances.id, agreementAcceptanceId),
        eq(merchantServiceAgreementAcceptances.merchantId, merchantId),
      ),
    );

  if (!isPaid) {
    return { fulfilled: false, reason: "not_paid" };
  }

  await db
    .update(merchants)
    .set({
      marketLockStatus: "pro",
      marketLockStatusUpdatedAt: now,
      updatedAt: now,
    })
    .where(eq(merchants.id, merchantId));

  return {
    fulfilled: true,
    agreementAcceptanceId,
    merchantId,
  };
}
