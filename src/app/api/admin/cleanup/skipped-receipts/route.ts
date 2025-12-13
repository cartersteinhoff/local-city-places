import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { skippedReceipts } from "@/db/schema";
import { lt } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { del } from "@vercel/blob";

// Cleanup skipped_receipts older than 30 days
// Can be called manually by admin or via cron job
// Vercel Cron: add to vercel.json with schedule

const MAX_AGE_DAYS = 30;

export async function POST(request: NextRequest) {
  try {
    // Check for cron secret (Vercel sends as Bearer token) or admin auth
    const authHeader = request.headers.get("authorization");
    const cronSecret = authHeader?.replace("Bearer ", "");
    const isValidCron = cronSecret === process.env.CRON_SECRET;

    if (!isValidCron) {
      // Fall back to admin auth
      const session = await getSession();
      if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Find records older than MAX_AGE_DAYS
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_AGE_DAYS);

    // Get old records (so we can delete their blob images)
    const oldRecords = await db
      .select({ id: skippedReceipts.id, imageUrl: skippedReceipts.imageUrl })
      .from(skippedReceipts)
      .where(lt(skippedReceipts.createdAt, cutoffDate));

    if (oldRecords.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No orphaned records to clean up",
        deleted: 0,
      });
    }

    // Delete blob images
    const blobDeleteResults = await Promise.allSettled(
      oldRecords.map((record) => {
        if (record.imageUrl) {
          return del(record.imageUrl);
        }
        return Promise.resolve();
      })
    );

    const blobErrors = blobDeleteResults.filter((r) => r.status === "rejected");
    if (blobErrors.length > 0) {
      console.warn(`Failed to delete ${blobErrors.length} blob images`);
    }

    // Delete database records
    await db
      .delete(skippedReceipts)
      .where(lt(skippedReceipts.createdAt, cutoffDate));

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${oldRecords.length} orphaned receipt(s)`,
      deleted: oldRecords.length,
      blobErrors: blobErrors.length,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    );
  }
}

// GET to check status (admin only)
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_AGE_DAYS);

    // Count records that would be cleaned up
    const oldRecords = await db
      .select({ id: skippedReceipts.id })
      .from(skippedReceipts)
      .where(lt(skippedReceipts.createdAt, cutoffDate));

    // Count total records
    const allRecords = await db
      .select({ id: skippedReceipts.id })
      .from(skippedReceipts);

    return NextResponse.json({
      total: allRecords.length,
      orphaned: oldRecords.length,
      maxAgeDays: MAX_AGE_DAYS,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Status check failed" },
      { status: 500 }
    );
  }
}
