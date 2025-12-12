import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, grcs, grcPurchases, reviews, members, merchants } from "@/db";
import { eq, and, sql, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== "merchant" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get merchant ID
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, session.user.id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const merchantId = merchant.id;

    // Get stats
    const [statsResult] = await db
      .select({
        activeGrcs: sql<number>`count(case when ${grcs.status} = 'active' then 1 end)::int`,
        completedGrcs: sql<number>`count(case when ${grcs.status} = 'completed' then 1 end)::int`,
        pendingGrcs: sql<number>`count(case when ${grcs.status} = 'pending' then 1 end)::int`,
        totalGrcs: sql<number>`count(*)::int`,
      })
      .from(grcs)
      .where(eq(grcs.merchantId, merchantId));

    // Get active members (distinct members with active GRCs)
    const [activeMembersResult] = await db
      .select({
        count: sql<number>`count(distinct ${grcs.memberId})::int`,
      })
      .from(grcs)
      .where(and(eq(grcs.merchantId, merchantId), eq(grcs.status, "active")));

    // Get review stats
    const [reviewStats] = await db
      .select({
        totalReviews: sql<number>`count(*)::int`,
        avgWordCount: sql<number>`coalesce(avg(${reviews.wordCount}), 0)::int`,
      })
      .from(reviews)
      .where(eq(reviews.merchantId, merchantId));

    // Get inventory by denomination
    const purchasesRaw = await db
      .select({
        denomination: grcPurchases.denomination,
        quantity: sql<number>`sum(${grcPurchases.quantity})::int`,
      })
      .from(grcPurchases)
      .where(
        and(
          eq(grcPurchases.merchantId, merchantId),
          eq(grcPurchases.paymentStatus, "confirmed")
        )
      )
      .groupBy(grcPurchases.denomination);

    // Get issued count per denomination
    const issuedRaw = await db
      .select({
        denomination: grcs.denomination,
        count: sql<number>`count(*)::int`,
      })
      .from(grcs)
      .where(eq(grcs.merchantId, merchantId))
      .groupBy(grcs.denomination);

    const issuedMap = new Map(issuedRaw.map((r) => [r.denomination, r.count]));

    const inventory = purchasesRaw.map((p) => ({
      denomination: p.denomination,
      purchased: p.quantity,
      issued: issuedMap.get(p.denomination) || 0,
      available: p.quantity - (issuedMap.get(p.denomination) || 0),
    })).sort((a, b) => a.denomination - b.denomination);

    // Get recent activity
    const recentGrcs = await db
      .select({
        id: grcs.id,
        memberId: grcs.memberId,
        denomination: grcs.denomination,
        status: grcs.status,
        registeredAt: grcs.registeredAt,
        createdAt: grcs.createdAt,
      })
      .from(grcs)
      .where(eq(grcs.merchantId, merchantId))
      .orderBy(desc(grcs.createdAt))
      .limit(10);

    // Get member names for recent GRCs
    const memberIds = recentGrcs
      .filter((g) => g.memberId)
      .map((g) => g.memberId as string);

    const memberNames = memberIds.length > 0
      ? await db
          .select({
            id: members.id,
            firstName: members.firstName,
            lastName: members.lastName,
          })
          .from(members)
          .where(sql`${members.id} = ANY(${memberIds})`)
      : [];

    const memberMap = new Map(
      memberNames.map((m) => [m.id, `${m.firstName} ${m.lastName.charAt(0)}.`])
    );

    // Get recent reviews
    const recentReviews = await db
      .select({
        id: reviews.id,
        memberId: reviews.memberId,
        wordCount: reviews.wordCount,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(eq(reviews.merchantId, merchantId))
      .orderBy(desc(reviews.createdAt))
      .limit(5);

    // Build activity feed
    type ActivityItem = {
      type: "registration" | "issued" | "review" | "completed";
      memberName: string | null;
      grcValue?: number;
      wordCount?: number;
      date: Date;
    };

    const activity: ActivityItem[] = [];

    for (const grc of recentGrcs) {
      if (grc.registeredAt && grc.memberId) {
        activity.push({
          type: "registration",
          memberName: memberMap.get(grc.memberId) || "Unknown",
          grcValue: grc.denomination,
          date: grc.registeredAt,
        });
      } else if (!grc.memberId) {
        activity.push({
          type: "issued",
          memberName: null,
          grcValue: grc.denomination,
          date: grc.createdAt,
        });
      }
      if (grc.status === "completed" && grc.memberId) {
        activity.push({
          type: "completed",
          memberName: memberMap.get(grc.memberId) || "Unknown",
          grcValue: grc.denomination,
          date: grc.createdAt,
        });
      }
    }

    // Add reviews to activity
    for (const review of recentReviews) {
      const reviewMemberIds = [review.memberId];
      const reviewMembers = await db
        .select({ id: members.id, firstName: members.firstName, lastName: members.lastName })
        .from(members)
        .where(sql`${members.id} = ANY(${reviewMemberIds})`);

      const reviewMemberName = reviewMembers[0]
        ? `${reviewMembers[0].firstName} ${reviewMembers[0].lastName.charAt(0)}.`
        : "Unknown";

      activity.push({
        type: "review",
        memberName: reviewMemberName,
        wordCount: review.wordCount,
        date: review.createdAt,
      });
    }

    // Sort by date
    activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      stats: {
        activeGrcs: statsResult?.activeGrcs || 0,
        completedGrcs: statsResult?.completedGrcs || 0,
        pendingGrcs: statsResult?.pendingGrcs || 0,
        totalGrcs: statsResult?.totalGrcs || 0,
        activeMembers: activeMembersResult?.count || 0,
        totalReviews: reviewStats?.totalReviews || 0,
      },
      inventory,
      recentActivity: activity.slice(0, 10),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
