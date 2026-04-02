import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { monthlyQualifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { syncFavoriteMerchantRewardStatusForGrc } from "@/lib/favorite-merchant";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ qualificationId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { qualificationId } = await params;
    const body = await request.json();
    const { action, trackingNumber } = body;

    if (action !== "mark_sent") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'mark_sent'" },
        { status: 400 }
      );
    }

    // Get the qualification
    const qualification = await db
      .select()
      .from(monthlyQualifications)
      .where(eq(monthlyQualifications.id, qualificationId))
      .limit(1);

    if (!qualification[0]) {
      return NextResponse.json({ error: "Qualification not found" }, { status: 404 });
    }

    if (qualification[0].rewardSentAt) {
      return NextResponse.json(
        { error: "Reward has already been sent" },
        { status: 400 }
      );
    }

    // Mark as sent
    await db
      .update(monthlyQualifications)
      .set({
        rewardSentAt: new Date(),
        giftCardTrackingNumber: trackingNumber || null,
      })
      .where(eq(monthlyQualifications.id, qualificationId));

    await syncFavoriteMerchantRewardStatusForGrc(qualification[0].grcId).catch((error) => {
      console.error("Failed to sync favorite merchant reward status after gift card fulfillment:", error);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating qualification:", error);
    return NextResponse.json(
      { error: "Failed to update qualification" },
      { status: 500 }
    );
  }
}
