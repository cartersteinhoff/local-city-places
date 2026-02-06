import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, grcs, grcPurchases, merchants } from "@/db";
import { eq, and, sql, inArray } from "drizzle-orm";
import { z } from "zod";

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
    const parsed = bulkIssueSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { recipients } = parsed.data;

    // Get current inventory
    const inventory = await getInventory(merchant.id);

    // Validate all recipients and check inventory
    const errors: { row: number; email: string; message: string }[] = [];
    const valid: typeof recipients = [];
    const requiredInventory = new Map<number, number>();

    // Check for existing GRCs from this merchant to any of these emails
    const recipientEmails = [...new Set(recipients.map((r) => r.email))];
    const existingGrcs = recipientEmails.length > 0
      ? await db
          .select({ recipientEmail: grcs.recipientEmail })
          .from(grcs)
          .where(
            and(
              eq(grcs.merchantId, merchant.id),
              inArray(grcs.recipientEmail, recipientEmails),
              inArray(grcs.status, ["pending", "active"])
            )
          )
      : [];
    const existingEmailSet = new Set(existingGrcs.map((g) => g.recipientEmail));

    // Track emails within this batch to detect intra-batch duplicates
    const batchEmailSet = new Set<string>();

    recipients.forEach((r, index) => {
      // Check valid denomination
      if (!GRC_PRICING[r.denomination]) {
        errors.push({
          row: index + 1,
          email: r.email,
          message: `Invalid denomination: $${r.denomination}`,
        });
        return;
      }

      // Check for duplicate against existing DB records
      if (existingEmailSet.has(r.email)) {
        errors.push({
          row: index + 1,
          email: r.email,
          message: "A GRC has already been issued to this email from your business",
        });
        return;
      }

      // Check for intra-batch duplicate
      if (batchEmailSet.has(r.email)) {
        errors.push({
          row: index + 1,
          email: r.email,
          message: "Duplicate email in batch",
        });
        return;
      }
      batchEmailSet.add(r.email);

      // Track required inventory
      const current = requiredInventory.get(r.denomination) || 0;
      requiredInventory.set(r.denomination, current + 1);

      valid.push(r);
    });

    // Check if we have enough inventory
    for (const [denom, required] of requiredInventory.entries()) {
      const available = inventory.get(denom) || 0;
      if (required > available) {
        // Find which recipients need this denomination and mark some as errors
        let toRemove = required - available;
        for (let i = valid.length - 1; i >= 0 && toRemove > 0; i--) {
          if (valid[i].denomination === denom) {
            errors.push({
              row: recipients.indexOf(valid[i]) + 1,
              email: valid[i].email,
              message: `Insufficient $${denom} GRC inventory (${available} available)`,
            });
            valid.splice(i, 1);
            toRemove--;
          }
        }
      }
    }

    if (valid.length === 0) {
      return NextResponse.json({
        success: false,
        issued: 0,
        errors,
        message: "No valid GRCs to issue",
      });
    }

    // Issue valid GRCs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const issuedGrcs: { email: string; name?: string; claimUrl: string; denomination: number }[] = [];

    for (const recipient of valid) {
      const costPerCert = GRC_PRICING[recipient.denomination].toString();
      const monthsRemaining = getTotalMonths(recipient.denomination);

      const [newGrc] = await db
        .insert(grcs)
        .values({
          merchantId: merchant.id,
          denomination: recipient.denomination,
          costPerCert,
          recipientEmail: recipient.email,
          monthsRemaining,
          status: "pending",
          issuedAt: new Date(),
        })
        .returning();

      const claimUrl = `${baseUrl}/claim/${newGrc.id}`;

      issuedGrcs.push({
        email: recipient.email,
        name: recipient.name,
        claimUrl,
        denomination: recipient.denomination,
      });

      // TODO: Send email to recipient
      console.log(`GRC issued to ${recipient.email}: ${claimUrl}`);
    }

    return NextResponse.json({
      success: true,
      issued: issuedGrcs.length,
      grcs: issuedGrcs,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Bulk issue GRC error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
