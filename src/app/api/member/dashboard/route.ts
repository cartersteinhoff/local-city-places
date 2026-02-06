import { NextResponse } from "next/server";
import { db } from "@/db";
import { grcs, members, monthlyQualifications, surveys } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get member profile
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.userId, session.user.id))
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Get active GRC
    const [activeGrc] = await db
      .select()
      .from(grcs)
      .where(
        and(
          eq(grcs.memberId, member.id),
          eq(grcs.status, "active")
        )
      )
      .limit(1);

    if (!activeGrc) {
      return NextResponse.json({
        thisMonthReceipts: 0,
        amountRemaining: 100,
        totalEarned: 0,
        monthsQualified: 0,
        currentMonth: null,
        activeGrc: null,
      });
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get or create current month qualification (lazy creation)
    let [currentQual] = await db
      .select()
      .from(monthlyQualifications)
      .where(
        and(
          eq(monthlyQualifications.memberId, member.id),
          eq(monthlyQualifications.grcId, activeGrc.id),
          eq(monthlyQualifications.month, currentMonth),
          eq(monthlyQualifications.year, currentYear)
        )
      )
      .limit(1);

    if (!currentQual) {
      // Check if this month is within the GRC's active period
      const grcStartMonth = activeGrc.startMonth || currentMonth;
      const grcStartYear = activeGrc.startYear || currentYear;
      const startDate = new Date(grcStartYear, grcStartMonth - 1);
      const nowDate = new Date(currentYear, currentMonth - 1);

      if (nowDate >= startDate) {
        [currentQual] = await db
          .insert(monthlyQualifications)
          .values({
            memberId: member.id,
            grcId: activeGrc.id,
            month: currentMonth,
            year: currentYear,
            status: "in_progress",
          })
          .returning();
      }
    }

    // Count qualified months
    const [qualifiedResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(monthlyQualifications)
      .where(
        and(
          eq(monthlyQualifications.memberId, member.id),
          eq(monthlyQualifications.grcId, activeGrc.id),
          eq(monthlyQualifications.status, "qualified")
        )
      );
    const monthsQualified = qualifiedResult?.count || 0;

    // Check if merchant has an active survey
    const [activeSurvey] = await db
      .select({ id: surveys.id })
      .from(surveys)
      .where(
        and(
          eq(surveys.merchantId, activeGrc.merchantId),
          eq(surveys.isActive, true)
        )
      )
      .limit(1);

    const thisMonthReceipts = parseFloat(currentQual?.approvedTotal || "0");
    const amountRemaining = Math.max(0, 100 - thisMonthReceipts);
    const totalEarned = monthsQualified * 25;

    return NextResponse.json({
      thisMonthReceipts,
      amountRemaining,
      totalEarned,
      monthsQualified,
      currentMonth: currentQual
        ? {
            approvedTotal: currentQual.approvedTotal,
            surveyCompletedAt: currentQual.surveyCompletedAt?.toISOString() || null,
            status: currentQual.status,
          }
        : null,
      activeGrc: {
        id: activeGrc.id,
        merchantId: activeGrc.merchantId,
        denomination: activeGrc.denomination,
        monthsRemaining: activeGrc.monthsRemaining,
      },
      hasSurvey: !!activeSurvey,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
