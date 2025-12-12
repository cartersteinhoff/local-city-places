import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { receipts, members, grcs, merchants, users, monthlyQualifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ receiptId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { receiptId } = await params;

    const receipt = await db
      .select({
        id: receipts.id,
        imageUrl: receipts.imageUrl,
        amount: receipts.amount,
        receiptDate: receipts.receiptDate,
        extractedStoreName: receipts.extractedStoreName,
        storeMismatch: receipts.storeMismatch,
        dateMismatch: receipts.dateMismatch,
        memberOverride: receipts.memberOverride,
        status: receipts.status,
        rejectionReason: receipts.rejectionReason,
        rejectionNotes: receipts.rejectionNotes,
        submittedAt: receipts.submittedAt,
        reviewedAt: receipts.reviewedAt,
        memberId: members.id,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        memberEmail: users.email,
        grcId: grcs.id,
        grcDenomination: grcs.denomination,
        groceryStore: grcs.groceryStore,
        merchantBusinessName: merchants.businessName,
      })
      .from(receipts)
      .innerJoin(members, eq(receipts.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .innerJoin(grcs, eq(receipts.grcId, grcs.id))
      .innerJoin(merchants, eq(grcs.merchantId, merchants.id))
      .where(eq(receipts.id, receiptId))
      .limit(1);

    if (!receipt[0]) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    const r = receipt[0];

    return NextResponse.json({
      receipt: {
        id: r.id,
        imageUrl: r.imageUrl,
        amount: r.amount,
        receiptDate: r.receiptDate?.toISOString() ?? null,
        extractedStoreName: r.extractedStoreName,
        storeMismatch: r.storeMismatch,
        dateMismatch: r.dateMismatch,
        memberOverride: r.memberOverride,
        status: r.status,
        rejectionReason: r.rejectionReason,
        rejectionNotes: r.rejectionNotes,
        submittedAt: r.submittedAt.toISOString(),
        reviewedAt: r.reviewedAt?.toISOString() ?? null,
        member: {
          id: r.memberId,
          firstName: r.memberFirstName,
          lastName: r.memberLastName,
          email: r.memberEmail,
        },
        grc: {
          id: r.grcId,
          denomination: r.grcDenomination,
          groceryStore: r.groceryStore,
        },
        merchant: {
          businessName: r.merchantBusinessName,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching receipt:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipt" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ receiptId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { receiptId } = await params;
    const body = await request.json();
    const { action, rejectionReason, rejectionNotes, reuploadDays = 7 } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Get the receipt with GRC info
    const receiptData = await db
      .select({
        id: receipts.id,
        memberId: receipts.memberId,
        grcId: receipts.grcId,
        amount: receipts.amount,
        status: receipts.status,
        receiptDate: receipts.receiptDate,
        startMonth: grcs.startMonth,
        startYear: grcs.startYear,
      })
      .from(receipts)
      .innerJoin(grcs, eq(receipts.grcId, grcs.id))
      .where(eq(receipts.id, receiptId))
      .limit(1);

    if (!receiptData[0]) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    const receipt = receiptData[0];

    if (receipt.status !== "pending") {
      return NextResponse.json(
        { error: "Receipt has already been reviewed" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Update receipt status
      await db
        .update(receipts)
        .set({
          status: "approved",
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
        })
        .where(eq(receipts.id, receiptId));

      // Update monthly qualification if we have the receipt date
      if (receipt.receiptDate && receipt.amount) {
        const receiptMonth = receipt.receiptDate.getMonth() + 1;
        const receiptYear = receipt.receiptDate.getFullYear();
        const amount = parseFloat(receipt.amount);

        // Find or check for existing qualification
        const existingQual = await db
          .select()
          .from(monthlyQualifications)
          .where(
            and(
              eq(monthlyQualifications.memberId, receipt.memberId),
              eq(monthlyQualifications.grcId, receipt.grcId),
              eq(monthlyQualifications.month, receiptMonth),
              eq(monthlyQualifications.year, receiptYear)
            )
          )
          .limit(1);

        if (existingQual[0]) {
          const currentTotal = parseFloat(existingQual[0].approvedTotal || "0");
          const newTotal = currentTotal + amount;

          // Update approved total
          await db
            .update(monthlyQualifications)
            .set({
              approvedTotal: newTotal.toFixed(2),
              // If total >= 100, mark as receipts_complete (survey still needed for qualified)
              status: newTotal >= 100 ? "receipts_complete" : existingQual[0].status,
            })
            .where(eq(monthlyQualifications.id, existingQual[0].id));
        }
      }
    } else {
      // Reject
      if (!rejectionReason) {
        return NextResponse.json(
          { error: "Rejection reason is required" },
          { status: 400 }
        );
      }

      const reuploadAllowedUntil = new Date();
      reuploadAllowedUntil.setDate(reuploadAllowedUntil.getDate() + reuploadDays);

      await db
        .update(receipts)
        .set({
          status: "rejected",
          rejectionReason,
          rejectionNotes: rejectionNotes || null,
          reuploadAllowedUntil,
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
        })
        .where(eq(receipts.id, receiptId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating receipt:", error);
    return NextResponse.json(
      { error: "Failed to update receipt" },
      { status: 500 }
    );
  }
}
