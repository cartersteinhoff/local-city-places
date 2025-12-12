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
    const body = await request.json();
    const { reason, notes } = body as { reason: string; notes?: string };

    if (!reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

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
        paymentStatus: "failed",
        rejectionReason: reason,
        paymentNotes: notes || null,
        paymentConfirmedBy: session.user.id,
      })
      .where(eq(grcPurchases.id, id));

    return NextResponse.json({
      success: true,
      message: "Order rejected",
    });
  } catch (error) {
    console.error("Reject order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
