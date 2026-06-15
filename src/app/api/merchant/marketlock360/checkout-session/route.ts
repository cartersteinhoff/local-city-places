import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db, merchantServiceAgreementAcceptances } from "@/db";
import { getSession } from "@/lib/auth";
import {
  getMarketLock360Currency,
  getMarketLock360MonthlyAmountCents,
} from "@/lib/marketlock360-pricing";
import { getRequestOrigin, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

class CheckoutConfigurationError extends Error {}

type AppSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;
type AppMerchant = NonNullable<AppSession["merchant"]>;
type AuthorizedSession =
  | { merchant: AppMerchant; session: AppSession }
  | {
      error:
        | "Unauthorized"
        | "Merchant not found"
        | "Trial request must be accepted before checkout.";
    };

const cardOnlyPaymentMethodTypes = [
  "card",
] satisfies Stripe.Checkout.SessionCreateParams.PaymentMethodType[];

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getMarketLock360LineItem(): Stripe.Checkout.SessionCreateParams.LineItem {
  const priceId = process.env.MARKETLOCK360_STRIPE_PRICE_ID?.trim();

  if (priceId) {
    return {
      price: priceId,
      quantity: 1,
    };
  }

  const amountCents = getMarketLock360MonthlyAmountCents();

  if (!amountCents) {
    throw new CheckoutConfigurationError(
      "MarketLock360 pricing is not configured. Set MARKETLOCK360_STRIPE_PRICE_ID or MARKETLOCK360_MONTHLY_AMOUNT_CENTS.",
    );
  }

  return {
    price_data: {
      currency: getMarketLock360Currency(),
      product_data: {
        name: "MARKETLOCK360 Monthly Service Period",
        description: "One-time charge for the current monthly service period.",
      },
      unit_amount: amountCents,
    },
    quantity: 1,
  };
}

function canAccessMarketLockCheckout(status: unknown) {
  return status === "trial" || status === "pro";
}

async function getAuthorizedSession(): Promise<AuthorizedSession> {
  const session = await getSession();

  if (
    !session ||
    (session.user.role !== "merchant" && session.user.role !== "admin")
  ) {
    return { error: "Unauthorized" as const };
  }

  if (!session.merchant) {
    return { error: "Merchant not found" as const };
  }

  if (!canAccessMarketLockCheckout(session.merchant.marketLockStatus)) {
    return {
      error: "Trial request must be accepted before checkout." as const,
    };
  }

  return { merchant: session.merchant, session };
}

function getAuthErrorStatus(error: string) {
  if (error === "Unauthorized") return 401;
  if (error === "Merchant not found") return 404;
  return 403;
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthorizedSession();

    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: getAuthErrorStatus(auth.error) },
      );
    }

    const body = (await request.json().catch(() => null)) as {
      agreementAcceptanceId?: unknown;
    } | null;
    const agreementAcceptanceId =
      typeof body?.agreementAcceptanceId === "string"
        ? body.agreementAcceptanceId.trim()
        : "";

    if (!uuidPattern.test(agreementAcceptanceId)) {
      return NextResponse.json(
        { error: "A signed agreement is required before checkout." },
        { status: 400 },
      );
    }

    const [agreementAcceptance] = await db
      .select({
        checkoutSessionId:
          merchantServiceAgreementAcceptances.checkoutSessionId,
        id: merchantServiceAgreementAcceptances.id,
        servicePeriodLabel:
          merchantServiceAgreementAcceptances.servicePeriodLabel,
      })
      .from(merchantServiceAgreementAcceptances)
      .where(
        and(
          eq(merchantServiceAgreementAcceptances.id, agreementAcceptanceId),
          eq(merchantServiceAgreementAcceptances.merchantId, auth.merchant.id),
        ),
      )
      .limit(1);

    if (!agreementAcceptance) {
      return NextResponse.json(
        { error: "Signed agreement was not found for this merchant." },
        { status: 404 },
      );
    }

    const stripe = getStripe();
    const metadata = {
      service: "marketlock360",
      merchantId: auth.merchant.id,
      userId: auth.session.user.id,
      agreementAcceptanceId: agreementAcceptance.id,
      servicePeriod: agreementAcceptance.servicePeriodLabel,
    };

    let checkoutSession: Stripe.Checkout.Session | null = null;

    if (agreementAcceptance.checkoutSessionId) {
      const existingCheckoutSession = await stripe.checkout.sessions.retrieve(
        agreementAcceptance.checkoutSessionId,
      );
      const existingPaymentMethodTypes =
        existingCheckoutSession.payment_method_types ?? [];
      const isCardOnlySession =
        existingPaymentMethodTypes.length === 1 &&
        existingPaymentMethodTypes[0] === "card";

      if (
        existingCheckoutSession.metadata?.merchantId === auth.merchant.id &&
        existingCheckoutSession.status === "open" &&
        existingCheckoutSession.ui_mode === "elements" &&
        existingCheckoutSession.client_secret &&
        isCardOnlySession
      ) {
        checkoutSession = existingCheckoutSession;
      }
    }

    checkoutSession ??= await stripe.checkout.sessions.create({
      billing_address_collection: "auto",
      client_reference_id: agreementAcceptance.id,
      customer_email: auth.session.user.email || undefined,
      line_items: [getMarketLock360LineItem()],
      metadata,
      mode: "payment",
      payment_method_types: cardOnlyPaymentMethodTypes,
      payment_intent_data: {
        metadata,
      },
      return_url: `${getRequestOrigin(request)}/merchant/marketlock360/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      ui_mode: "elements",
    });

    if (!checkoutSession.client_secret) {
      throw new Error("Stripe did not return a checkout elements secret");
    }

    const paymentIntentId =
      typeof checkoutSession.payment_intent === "string"
        ? checkoutSession.payment_intent
        : checkoutSession.payment_intent?.id || null;

    await db
      .update(merchantServiceAgreementAcceptances)
      .set({
        checkoutSessionId: checkoutSession.id,
        paymentAmountCents:
          checkoutSession.amount_total ?? getMarketLock360MonthlyAmountCents(),
        paymentCurrency: checkoutSession.currency ?? getMarketLock360Currency(),
        paymentStatus: checkoutSession.payment_status,
        stripePaymentIntentId: paymentIntentId,
      })
      .where(
        eq(merchantServiceAgreementAcceptances.id, agreementAcceptance.id),
      );

    return NextResponse.json({
      clientSecret: checkoutSession.client_secret,
      checkoutSessionId: checkoutSession.id,
    });
  } catch (error) {
    if (error instanceof CheckoutConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.error("MarketLock360 checkout session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthorizedSession();

    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: getAuthErrorStatus(auth.error) },
      );
    }

    const sessionId = new URL(request.url).searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Checkout session ID is required" },
        { status: 400 },
      );
    }

    const checkoutSession =
      await getStripe().checkout.sessions.retrieve(sessionId);

    if (checkoutSession.metadata?.merchantId !== auth.merchant.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: checkoutSession.status,
      paymentStatus: checkoutSession.payment_status,
      customerEmail:
        checkoutSession.customer_details?.email ||
        checkoutSession.customer_email ||
        null,
    });
  } catch (error) {
    console.error("MarketLock360 checkout status error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve checkout session" },
      { status: 500 },
    );
  }
}
