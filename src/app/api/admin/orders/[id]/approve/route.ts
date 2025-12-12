import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { grcPurchases, grcs } from "@/db/schema";
import { eq } from "drizzle-orm";

// GRC pricing tiers (cost per certificate)
const GRC_PRICING: Record<number, number> = {
  50: 1.25, 75: 1.50, 100: 1.75, 125: 2.00, 150: 2.25,
  175: 2.50, 200: 2.75, 225: 3.00, 250: 3.25, 275: 3.50,
  300: 3.75, 325: 4.00, 350: 4.25, 375: 4.50, 400: 4.75,
  425: 5.00, 450: 5.25, 475: 5.50, 500: 5.75,
};

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

    // Update purchase status
    await db
      .update(grcPurchases)
      .set({
        paymentStatus: "confirmed",
        paymentConfirmedAt: new Date(),
        paymentConfirmedBy: session.user.id,
        paymentNotes: notes || null,
      })
      .where(eq(grcPurchases.id, id));

    // Create GRC records for the merchant
    const costPerCert = GRC_PRICING[purchase.denomination] || 0;
    const grcRecords = [];

    for (let i = 0; i < purchase.quantity; i++) {
      grcRecords.push({
        merchantId: purchase.merchantId,
        denomination: purchase.denomination,
        costPerCert: costPerCert.toFixed(2),
        status: "pending" as const, // Available in inventory
        monthsRemaining: purchase.denomination >= 200 ? 12 : 6, // 12 months for $200+, 6 for others
      });
    }

    // Insert all GRCs
    await db.insert(grcs).values(grcRecords);

    return NextResponse.json({
      success: true,
      message: `Created ${purchase.quantity} GRCs for merchant`,
    });
  } catch (error) {
    console.error("Approve order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
