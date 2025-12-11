import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { receipts, members, grcs, merchants } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get member profile
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.userId, session.user.id))
      .limit(1);

    if (!member) {
      return NextResponse.json(
        { error: "Member profile not found" },
        { status: 400 }
      );
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, approved, rejected
    const grcId = searchParams.get("grcId");

    // Build query
    let query = db
      .select({
        id: receipts.id,
        imageUrl: receipts.imageUrl,
        amount: receipts.amount,
        receiptDate: receipts.receiptDate,
        extractedStoreName: receipts.extractedStoreName,
        storeMismatch: receipts.storeMismatch,
        dateMismatch: receipts.dateMismatch,
        status: receipts.status,
        rejectionReason: receipts.rejectionReason,
        rejectionNotes: receipts.rejectionNotes,
        reuploadAllowedUntil: receipts.reuploadAllowedUntil,
        submittedAt: receipts.submittedAt,
        reviewedAt: receipts.reviewedAt,
        grc: {
          id: grcs.id,
          denomination: grcs.denomination,
          groceryStore: grcs.groceryStore,
        },
        merchant: {
          businessName: merchants.businessName,
        },
      })
      .from(receipts)
      .innerJoin(grcs, eq(receipts.grcId, grcs.id))
      .innerJoin(merchants, eq(grcs.merchantId, merchants.id))
      .where(eq(receipts.memberId, member.id))
      .orderBy(desc(receipts.submittedAt));

    const receiptList = await query;

    // Apply filters in JS since drizzle doesn't support dynamic where chaining well
    let filteredReceipts = receiptList;
    if (status) {
      filteredReceipts = filteredReceipts.filter((r) => r.status === status);
    }
    if (grcId) {
      filteredReceipts = filteredReceipts.filter((r) => r.grc.id === grcId);
    }

    return NextResponse.json({ receipts: filteredReceipts });
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipts" },
      { status: 500 }
    );
  }
}
