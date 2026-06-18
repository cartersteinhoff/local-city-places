import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { syncMarketLock360CheckoutSession } from "@/lib/marketlock360-checkout";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook secret is not configured" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret,
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.expired":
      case "checkout.session.async_payment_succeeded":
      case "checkout.session.async_payment_failed": {
        await syncMarketLock360CheckoutSession(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Stripe webhook endpoint is active" });
}
