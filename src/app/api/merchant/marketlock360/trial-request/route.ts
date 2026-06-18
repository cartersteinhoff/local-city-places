import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, merchants } from "@/db";
import { getSession } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getSession();

    if (
      !session ||
      (session.user.role !== "merchant" && session.user.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 },
      );
    }

    if (session.merchant.marketLockStatus === "pro") {
      return NextResponse.json({
        success: true,
        marketLockStatus: "pro",
        marketLockStatusUpdatedAt:
          session.merchant.marketLockStatusUpdatedAt.toISOString(),
      });
    }

    if (session.merchant.marketLockStatus === "trial") {
      return NextResponse.json({
        success: true,
        marketLockStatus: "trial",
        marketLockStatusUpdatedAt:
          session.merchant.marketLockStatusUpdatedAt.toISOString(),
      });
    }

    if (session.merchant.marketLockStatus === "trial_requested") {
      return NextResponse.json({
        success: true,
        marketLockStatus: "trial_requested",
        marketLockStatusUpdatedAt:
          session.merchant.marketLockStatusUpdatedAt.toISOString(),
      });
    }

    const now = new Date();

    await db
      .update(merchants)
      .set({
        marketLockStatus: "trial_requested",
        marketLockStatusUpdatedAt: now,
        updatedAt: now,
      })
      .where(eq(merchants.id, session.merchant.id));

    return NextResponse.json({
      success: true,
      marketLockStatus: "trial_requested",
      marketLockStatusUpdatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("MarketLock360 trial request error:", error);
    return NextResponse.json(
      { error: "Failed to request trial" },
      { status: 500 },
    );
  }
}
