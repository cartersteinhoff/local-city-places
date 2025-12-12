import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, grcs, grcPurchases, merchants } from "@/db";
import { eq, and, sql } from "drizzle-orm";

// GRC pricing tiers
const GRC_PRICING: Record<number, number> = {
  50: 1.25, 75: 1.50, 100: 1.75, 125: 2.00, 150: 2.25,
  175: 2.50, 200: 2.75, 225: 3.00, 250: 3.25, 275: 3.50,
  300: 3.75, 325: 4.00, 350: 4.25, 375: 4.50, 400: 4.75,
  425: 5.00, 450: 5.25, 475: 5.50, 500: 5.75,
};

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== "merchant" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get merchant
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, session.user.id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // Get purchases by denomination
    const purchasesRaw = await db
      .select({
        denomination: grcPurchases.denomination,
        quantity: sql<number>`sum(${grcPurchases.quantity})::int`,
      })
      .from(grcPurchases)
      .where(
        and(
          eq(grcPurchases.merchantId, merchant.id),
          eq(grcPurchases.paymentStatus, "confirmed")
        )
      )
      .groupBy(grcPurchases.denomination);

    // Get issued count per denomination
    const issuedRaw = await db
      .select({
        denomination: grcs.denomination,
        count: sql<number>`count(*)::int`,
      })
      .from(grcs)
      .where(eq(grcs.merchantId, merchant.id))
      .groupBy(grcs.denomination);

    const issuedMap = new Map(issuedRaw.map((r) => [r.denomination, r.count]));

    const inventory = purchasesRaw.map((p) => ({
      denomination: p.denomination,
      purchased: p.quantity,
      issued: issuedMap.get(p.denomination) || 0,
      available: p.quantity - (issuedMap.get(p.denomination) || 0),
      costPerCert: GRC_PRICING[p.denomination] || 0,
    })).sort((a, b) => a.denomination - b.denomination);

    // Also return available denominations (those with inventory)
    const availableDenominations = inventory
      .filter((i) => i.available > 0)
      .map((i) => ({
        denomination: i.denomination,
        available: i.available,
        costPerCert: i.costPerCert,
      }));

    return NextResponse.json({
      inventory,
      availableDenominations,
    });
  } catch (error) {
    console.error("Inventory API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
