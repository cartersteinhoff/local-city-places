import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { grcPurchases } from "@/db/schema";
import { eq } from "drizzle-orm";

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
