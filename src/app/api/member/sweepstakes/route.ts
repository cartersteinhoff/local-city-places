import { and, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  db,
  members,
  sweepstakesEntries,
  sweepstakesReferralActivations,
} from "@/db";
import { getSession } from "@/lib/auth";
import {
  buildSweepstakesReferralLink,
  ensureCurrentSweepstakesCycle,
  ensureSweepstakesReferralCode,
  getActiveSweepstakesWinners,
  getSweepstakesLeaderboard,
} from "@/lib/sweepstakes";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.userId, session.user.id))
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const cycle = await ensureCurrentSweepstakesCycle();
    const referralCode = await ensureSweepstakesReferralCode(member.id);

    const [cycleEntry] = await db
      .select({
        id: sweepstakesEntries.id,
        status: sweepstakesEntries.status,
        confirmedAt: sweepstakesEntries.confirmedAt,
      })
      .from(sweepstakesEntries)
      .where(
        and(
          eq(sweepstakesEntries.memberId, member.id),
          eq(sweepstakesEntries.cycleId, cycle.id),
          eq(sweepstakesEntries.status, "confirmed"),
        ),
      )
      .orderBy(
        desc(sweepstakesEntries.confirmedAt),
        desc(sweepstakesEntries.createdAt),
      )
      .limit(1);

    const [entryCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sweepstakesEntries)
      .where(
        and(
          eq(sweepstakesEntries.memberId, member.id),
          eq(sweepstakesEntries.cycleId, cycle.id),
          eq(sweepstakesEntries.status, "confirmed"),
        ),
      );

    const [activatedReferralsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sweepstakesReferralActivations)
      .where(
        and(
          eq(sweepstakesReferralActivations.referrerMemberId, member.id),
          eq(sweepstakesReferralActivations.cycleId, cycle.id),
        ),
      );

    const leaderboard = await getSweepstakesLeaderboard(cycle.id);
    const currentStanding =
      leaderboard.find((row) => row.memberId === member.id) || null;

    return NextResponse.json({
      cycle: {
        id: cycle.id,
        name: cycle.name,
        year: cycle.year,
        month: cycle.month,
        endsAt: cycle.endsAt?.toISOString?.() ?? null,
        grandPrizeLabel: cycle.grandPrizeLabel,
      },
      cycleEntry: cycleEntry
        ? {
            id: cycleEntry.id,
            status: cycleEntry.status,
            confirmedAt: cycleEntry.confirmedAt?.toISOString() ?? null,
          }
        : null,
      confirmedEntriesThisMonth: entryCountResult?.count ?? 0,
      activatedReferrals: activatedReferralsResult?.count ?? 0,
      combinedEntriesThisMonth:
        (entryCountResult?.count ?? 0) + (activatedReferralsResult?.count ?? 0),
      referralCode: referralCode.code,
      referralLink: buildSweepstakesReferralLink(referralCode.code),
      leaderboardPreview: leaderboard.slice(0, 10),
      currentStanding,
      winners: await getActiveSweepstakesWinners(cycle.id),
    });
  } catch (error) {
    console.error("Error fetching member sweepstakes data:", error);
    return NextResponse.json(
      { error: "Failed to fetch sweepstakes data" },
      { status: 500 },
    );
  }
}
