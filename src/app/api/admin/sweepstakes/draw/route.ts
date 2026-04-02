import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { drawSweepstakesWinners } from "@/lib/sweepstakes";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const cycleId = body.cycleId?.trim();
    const winnerMemberId = body.winnerMemberId?.trim() || undefined;
    const notes = body.notes?.trim() || undefined;

    if (!cycleId) {
      return NextResponse.json({ error: "cycleId is required" }, { status: 400 });
    }

    const result = await drawSweepstakesWinners({
      cycleId,
      selectedByUserId: session.user.id,
      forcedGrandWinnerMemberId: winnerMemberId,
      notes,
    });

    return NextResponse.json({
      success: true,
      cycle: {
        id: result.cycle.id,
        name: result.cycle.name,
        grandPrizeLabel: result.cycle.grandPrizeLabel,
      },
      winners: result.winners,
    });
  } catch (error) {
    console.error("Error drawing sweepstakes winners:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to draw sweepstakes winners",
      },
      { status: 500 }
    );
  }
}
