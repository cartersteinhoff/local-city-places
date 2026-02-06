import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { grcPurchases, merchants, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { notes } = body as { notes?: string };

    // Get the purchase
    const [purchase] = await db
      .select()
      .from(grcPurchases)
      .where(eq(grcPurchases.id, id))
      .limit(1);

    if (!purchase) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (purchase.paymentStatus !== "pending") {
      return NextResponse.json(
        { error: "Order is not pending" },
        { status: 400 }
      );
    }

    // Update purchase status to confirmed
    // GRCs are NOT created here - they are created when the merchant issues them
    // The grcPurchases table tracks inventory (confirmed purchases)
    // The grcs table tracks issued certificates (to customers)
    await db
      .update(grcPurchases)
      .set({
        paymentStatus: "confirmed",
        paymentConfirmedAt: new Date(),
        paymentConfirmedBy: session.user.id,
        paymentNotes: notes || null,
      })
      .where(eq(grcPurchases.id, id));

    // Send confirmation email to merchant (fire-and-forget)
    try {
      const [merchant] = await db
        .select({ businessName: merchants.businessName, userId: merchants.userId })
        .from(merchants)
        .where(eq(merchants.id, purchase.merchantId))
        .limit(1);

      if (merchant?.userId) {
        const [user] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, merchant.userId))
          .limit(1);

        if (user) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          const totalValue = purchase.quantity * purchase.denomination;
          sendEmail({
            to: user.email,
            subject: `Your GRC order has been approved - ${purchase.quantity}x $${purchase.denomination}`,
            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Your GRC Order Has Been Approved!</h2>
  <p>Hi there,</p>
  <p>Great news! Your GRC purchase for <strong>${merchant.businessName}</strong> has been confirmed and is now available to issue.</p>
  <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 12px; padding: 20px; margin: 24px 0;">
    <p style="margin: 0 0 8px 0; color: #15803d; font-weight: bold; font-size: 18px;">${purchase.quantity}x $${purchase.denomination} GRCs</p>
    <p style="margin: 0; color: #166534;">Total value: $${totalValue.toLocaleString()}</p>
  </div>
  <p>You can now issue these GRCs to your customers from your dashboard.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="${appUrl}/merchant/issue" style="display: inline-block; background: linear-gradient(135deg, #ff7a3c, #ff9f1c); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Issue GRCs Now</a>
  </div>
</div>`,
            text: `Your GRC Order Has Been Approved!\n\nYour purchase of ${purchase.quantity}x $${purchase.denomination} GRCs for ${merchant.businessName} has been confirmed.\n\nTotal value: $${totalValue.toLocaleString()}\n\nIssue GRCs: ${appUrl}/merchant/issue`,
          }).catch((err) => console.error("Failed to send order approval email:", err));
        }
      }
    } catch (emailErr) {
      console.error("Failed to prepare order approval email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: `Confirmed payment for ${purchase.quantity}x $${purchase.denomination} GRCs`,
    });
  } catch (error) {
    console.error("Approve order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
