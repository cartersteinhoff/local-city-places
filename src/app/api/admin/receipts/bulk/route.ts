import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { receipts, grcs, monthlyQualifications, surveys } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { syncFavoriteMerchantRewardStatusForGrc } from "@/lib/favorite-merchant";
import { checkAndCompleteGrc } from "@/lib/grc-lifecycle";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { receiptIds, action, rejectionReason } = body;

    if (!receiptIds || !Array.isArray(receiptIds) || receiptIds.length === 0) {
      return NextResponse.json(
        { error: "receiptIds array is required" },
        { status: 400 }
      );
    }

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    if (action === "reject" && !rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required for bulk reject" },
        { status: 400 }
      );
    }

    // Get all pending receipts from the list
    const pendingReceipts = await db
      .select({
        id: receipts.id,
        memberId: receipts.memberId,
        grcId: receipts.grcId,
        amount: receipts.amount,
        receiptDate: receipts.receiptDate,
      })
      .from(receipts)
      .where(
        and(
          inArray(receipts.id, receiptIds),
          eq(receipts.status, "pending")
        )
      );

    if (pendingReceipts.length === 0) {
      return NextResponse.json(
        { error: "No pending receipts found in the provided list" },
        { status: 400 }
      );
    }

    let updated = 0;
    let failed = 0;

    if (action === "approve") {
      // Bulk approve
      await db
        .update(receipts)
        .set({
          status: "approved",
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
        })
        .where(
          and(
            inArray(receipts.id, receiptIds),
            eq(receipts.status, "pending")
          )
        );

      // Update monthly qualifications for each approved receipt
      for (const receipt of pendingReceipts) {
        try {
          if (receipt.receiptDate && receipt.amount) {
            const receiptMonth = receipt.receiptDate.getMonth() + 1;
            const receiptYear = receipt.receiptDate.getFullYear();
            const amount = parseFloat(receipt.amount);

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
              let newStatus = existingQual[0].status;

              if (newTotal >= 100 && (newStatus === "in_progress" || newStatus === "receipts_complete")) {
                const surveyDone = !!existingQual[0].surveyCompletedAt;

                if (surveyDone) {
                  newStatus = "qualified";
                } else {
                  const [grcData] = await db
                    .select({ merchantId: grcs.merchantId })
                    .from(grcs)
                    .where(eq(grcs.id, receipt.grcId))
                    .limit(1);

                  if (grcData) {
                    const [activeSurvey] = await db
                      .select({ id: surveys.id })
                      .from(surveys)
                      .where(
                        and(
                          eq(surveys.merchantId, grcData.merchantId),
                          eq(surveys.isActive, true)
                        )
                      )
                      .limit(1);

                    newStatus = activeSurvey ? "receipts_complete" : "qualified";
                  } else {
                    newStatus = "receipts_complete";
                  }
                }
              }

              await db
                .update(monthlyQualifications)
                .set({
                  approvedTotal: newTotal.toFixed(2),
                  status: newStatus,
                })
                .where(eq(monthlyQualifications.id, existingQual[0].id));

              if (newStatus === "qualified") {
                await checkAndCompleteGrc(receipt.memberId, receipt.grcId);
              }

              await syncFavoriteMerchantRewardStatusForGrc(receipt.grcId).catch((error) => {
                console.error("Failed to sync favorite merchant reward status after bulk receipt approval:", error);
              });
            }
          }
          updated++;
        } catch (err) {
          console.error(`Error updating qualification for receipt ${receipt.id}:`, err);
          failed++;
        }
      }
    } else {
      // Bulk reject
      const reuploadAllowedUntil = new Date();
      reuploadAllowedUntil.setDate(reuploadAllowedUntil.getDate() + 7);

      await db
        .update(receipts)
        .set({
          status: "rejected",
          rejectionReason,
          reuploadAllowedUntil,
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
        })
        .where(
          and(
            inArray(receipts.id, receiptIds),
            eq(receipts.status, "pending")
          )
        );

      updated = pendingReceipts.length;
    }

    return NextResponse.json({
      success: true,
      updated: action === "approve" ? updated : pendingReceipts.length,
      failed,
    });
  } catch (error) {
    console.error("Error bulk updating receipts:", error);
    return NextResponse.json(
      { error: "Failed to bulk update receipts" },
      { status: 500 }
    );
  }
}
