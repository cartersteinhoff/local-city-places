import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, members } from "@/db";
import { getSession } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "member") {
      return NextResponse.json(
        { error: "Only members can enter from the dashboard" },
        { status: 403 },
      );
    }

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.userId, session.user.id))
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        error:
          "Submit a favorite merchant nomination to lock in your sweepstakes entry.",
      },
      { status: 409 },
    );
  } catch (error) {
    console.error("Dashboard sweepstakes entry error:", error);
    return NextResponse.json(
      { error: "Failed to confirm sweepstakes entry from the dashboard" },
      { status: 500 },
    );
  }
}
