import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { monthlyQualifications } from "@/db/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { qualificationIds, trackingNumbers } = body;

    if (!qualificationIds || !Array.isArray(qualificationIds) || qualificationIds.length === 0) {
      return NextResponse.json(
        { error: "qualificationIds array is required" },
        { status: 400 }
      );
    }

    // Get all pending qualifications from the list
    const pendingQualifications = await db
      .select()
      .from(monthlyQualifications)
      .where(
        and(
          inArray(monthlyQualifications.id, qualificationIds),
          eq(monthlyQualifications.status, "qualified"),
          isNull(monthlyQualifications.rewardSentAt)
        )
      );

    if (pendingQualifications.length === 0) {
      return NextResponse.json(
        { error: "No pending qualifications found in the provided list" },
        { status: 400 }
      );
    }

    // Update each qualification
    let updated = 0;
    for (const qual of pendingQualifications) {
      const trackingNumber = trackingNumbers?.[qual.id] || null;

      await db
        .update(monthlyQualifications)
        .set({
          rewardSentAt: new Date(),
          giftCardTrackingNumber: trackingNumber,
        })
        .where(eq(monthlyQualifications.id, qual.id));

      updated++;
    }

    return NextResponse.json({
      success: true,
      updated,
    });
  } catch (error) {
    console.error("Error bulk updating qualifications:", error);
    return NextResponse.json(
      { error: "Failed to bulk update qualifications" },
      { status: 500 }
    );
  }
}
