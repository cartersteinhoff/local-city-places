import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { createOrConfirmDashboardSweepstakesEntry } from "@/lib/sweepstakes";
import { db, members } from "@/db";

export async function POST() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "member") {
      return NextResponse.json({ error: "Only members can enter from the dashboard" }, { status: 403 });
    }

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.userId, session.user.id))
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const entryName =
      [session.user.firstName, session.user.lastName].filter(Boolean).join(" ").trim() ||
      session.user.email;

    const { alreadyEnteredToday } = await createOrConfirmDashboardSweepstakesEntry({
      userId: session.user.id,
      memberId: member.id,
      entryName,
      entryEmail: session.user.email,
    });

    return NextResponse.json({
      success: true,
      alreadyEnteredToday,
      message: alreadyEnteredToday
        ? "Today's entry is already confirmed."
        : "Today's Favorite Merchant Sweepstakes entry is confirmed.",
    });
  } catch (error) {
    console.error("Dashboard sweepstakes entry error:", error);
    return NextResponse.json(
      { error: "Failed to confirm sweepstakes entry from the dashboard" },
      { status: 500 }
    );
  }
}
