import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getActiveSweepstakesWinners,
  getAvailableSweepstakesCycles,
  getDefaultAdminSweepstakesCycle,
  getSweepstakesLeaderboard,
} from "@/lib/sweepstakes";
import { db, sweepstakesCycles } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get("cycleId");

    const selectedCycle = cycleId
      ? (
          await db
            .select()
            .from(sweepstakesCycles)
            .where(eq(sweepstakesCycles.id, cycleId))
            .limit(1)
        )[0]
      : await getDefaultAdminSweepstakesCycle();

    if (!selectedCycle) {
      return NextResponse.json({ error: "No sweepstakes cycle found" }, { status: 404 });
    }

    const [cycles, leaderboard, winners] = await Promise.all([
      getAvailableSweepstakesCycles(),
      getSweepstakesLeaderboard(selectedCycle.id),
      getActiveSweepstakesWinners(selectedCycle.id),
    ]);

    const regularEntries = leaderboard.reduce((sum, row) => sum + row.regularEntries, 0);
    const referralEntries = leaderboard.reduce((sum, row) => sum + row.referralEntries, 0);
    const totalEntries = leaderboard.reduce((sum, row) => sum + row.totalEntries, 0);

    return NextResponse.json({
      cycle: {
        id: selectedCycle.id,
        name: selectedCycle.name,
        year: selectedCycle.year,
        month: selectedCycle.month,
        startsAt: selectedCycle.startsAt.toISOString(),
        endsAt: selectedCycle.endsAt.toISOString(),
        status: selectedCycle.status,
        grandPrizeLabel: selectedCycle.grandPrizeLabel,
        hasEnded: selectedCycle.endsAt <= new Date(),
      },
      cycles: cycles.map((cycle) => ({
        id: cycle.id,
        name: cycle.name,
        year: cycle.year,
        month: cycle.month,
        endsAt: cycle.endsAt.toISOString(),
        status: cycle.status,
        hasEnded: cycle.endsAt <= new Date(),
      })),
      stats: {
        participants: leaderboard.length,
        regularEntries,
        referralEntries,
        totalEntries,
      },
      winners,
      leaderboard,
    });
  } catch (error) {
    console.error("Error fetching admin sweepstakes data:", error);
    return NextResponse.json(
      { error: "Failed to fetch sweepstakes admin data" },
      { status: 500 }
    );
  }
}
