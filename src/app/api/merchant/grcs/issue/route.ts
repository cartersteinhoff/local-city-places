import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, grcs, grcPurchases, merchants, users } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

const issueGrcSchema = z.object({
  email: z.string().email("Invalid email address"),
  recipientName: z.string().optional(),
  denomination: z.number().int().min(50).max(500),
});

const bulkIssueSchema = z.object({
  recipients: z.array(
    z.object({
      email: z.string().email("Invalid email address"),
      name: z.string().optional(),
      denomination: z.number().int().min(50).max(500),
    })
  ).min(1).max(500),
});

// GRC pricing tiers
const GRC_PRICING: Record<number, number> = {
  50: 1.25, 75: 1.50, 100: 1.75, 125: 2.00, 150: 2.25,
  175: 2.50, 200: 2.75, 225: 3.00, 250: 3.25, 275: 3.50,
  300: 3.75, 325: 4.00, 350: 4.25, 375: 4.50, 400: 4.75,
  425: 5.00, 450: 5.25, 475: 5.50, 500: 5.75,
};

// Calculate months based on denomination
function getTotalMonths(denomination: number): number {
  if (denomination <= 75) return 2;
  if (denomination <= 125) return 3;
  if (denomination <= 175) return 4;
  if (denomination <= 250) return 5;
  if (denomination <= 350) return 6;
  if (denomination <= 450) return 8;
  return 10;
}

async function getInventory(merchantId: string) {
  const purchasesRaw = await db
    .select({
      denomination: grcPurchases.denomination,
      quantity: sql<number>`sum(${grcPurchases.quantity})::int`,
    })
    .from(grcPurchases)
    .where(
      and(
        eq(grcPurchases.merchantId, merchantId),
        eq(grcPurchases.paymentStatus, "confirmed")
      )
    )
    .groupBy(grcPurchases.denomination);

  const issuedRaw = await db
    .select({
      denomination: grcs.denomination,
      count: sql<number>`count(*)::int`,
    })
    .from(grcs)
    .where(eq(grcs.merchantId, merchantId))
    .groupBy(grcs.denomination);

  const issuedMap = new Map(issuedRaw.map((r) => [r.denomination, r.count]));

  return new Map(
    purchasesRaw.map((p) => [
      p.denomination,
      p.quantity - (issuedMap.get(p.denomination) || 0),
    ])
  );
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const parsed = issueGrcSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, recipientName, denomination } = parsed.data;

    // Check if denomination is valid
    if (!GRC_PRICING[denomination]) {
      return NextResponse.json(
        { error: "Invalid denomination" },
        { status: 400 }
      );
    }

    // Check inventory
    const inventory = await getInventory(merchant.id);
    const available = inventory.get(denomination) || 0;

    if (available < 1) {
      return NextResponse.json(
        { error: `No ${denomination} GRCs available. Purchase more to continue.` },
        { status: 400 }
      );
    }

    // Create GRC
    const costPerCert = GRC_PRICING[denomination].toString();
    const monthsRemaining = getTotalMonths(denomination);

    const [newGrc] = await db
      .insert(grcs)
      .values({
        merchantId: merchant.id,
        denomination,
        costPerCert,
        monthsRemaining,
        status: "pending",
        issuedAt: new Date(),
      })
      .returning();

    // Generate claim URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const claimUrl = `${baseUrl}/claim/${newGrc.id}`;

    // TODO: Send email to recipient with claim link
    // For now, just return the claim URL
    console.log(`GRC issued to ${email}: ${claimUrl}`);

    return NextResponse.json({
      success: true,
      grc: {
        id: newGrc.id,
        denomination,
        claimUrl,
        recipientEmail: email,
        recipientName: recipientName || null,
      },
    });
  } catch (error) {
    console.error("Issue GRC error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
