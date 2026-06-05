import { desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import {
  db,
  favoriteMerchantTestimonials,
  members,
  merchants,
  reviews,
  sweepstakesEntries,
  users,
} from "@/db";
import { getSession } from "@/lib/auth";

function getStartDate(range: string) {
  const now = new Date();
  switch (range) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "ytd":
      return new Date(now.getFullYear(), 0, 1);
    case "all":
      return new Date(2020, 0, 1);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const range = request.nextUrl.searchParams.get("range") || "30d";
    const startDate = getStartDate(range);

    const [
      totalUsersResult,
      newUsersResult,
      totalMerchantsResult,
      verifiedMerchantsResult,
      totalReviewsResult,
      nominationsResult,
      sweepstakesEntriesResult,
      usersByRoleResult,
      nominationsByStatusResult,
      merchantsByStateResult,
      topMerchantsByReviewsResult,
      weeklySignupsResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(gte(users.createdAt, startDate)),
      db.select({ count: sql<number>`count(*)::int` }).from(merchants),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(merchants)
        .where(eq(merchants.verified, true)),
      db.select({ count: sql<number>`count(*)::int` }).from(reviews),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(favoriteMerchantTestimonials),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(sweepstakesEntries)
        .where(eq(sweepstakesEntries.status, "confirmed")),
      db
        .select({ role: users.role, count: sql<number>`count(*)::int` })
        .from(users)
        .groupBy(users.role),
      db
        .select({
          status: favoriteMerchantTestimonials.status,
          count: sql<number>`count(*)::int`,
        })
        .from(favoriteMerchantTestimonials)
        .groupBy(favoriteMerchantTestimonials.status),
      db
        .select({
          state: merchants.state,
          count: sql<number>`count(*)::int`,
        })
        .from(merchants)
        .where(isNotNull(merchants.state))
        .groupBy(merchants.state)
        .orderBy(desc(sql`count(*)`))
        .limit(10),
      db
        .select({
          id: merchants.id,
          name: merchants.businessName,
          reviewCount: sql<number>`count(${reviews.id})::int`,
        })
        .from(merchants)
        .leftJoin(reviews, eq(reviews.merchantId, merchants.id))
        .groupBy(merchants.id)
        .orderBy(desc(sql`count(${reviews.id})`))
        .limit(10),
      db
        .select({
          week: sql<string>`TO_CHAR(DATE_TRUNC('week', ${users.createdAt}), 'YYYY-MM-DD')`,
          total: sql<number>`count(*)::int`,
          members: sql<number>`count(*) filter (where ${users.role} = 'member')::int`,
          merchants: sql<number>`count(*) filter (where ${users.role} = 'merchant')::int`,
        })
        .from(users)
        .where(gte(users.createdAt, startDate))
        .groupBy(sql`DATE_TRUNC('week', ${users.createdAt})`)
        .orderBy(sql`DATE_TRUNC('week', ${users.createdAt})`),
    ]);

    const usersByRole = { members: 0, merchants: 0, admins: 0 };
    for (const row of usersByRoleResult) {
      if (row.role === "member") usersByRole.members = Number(row.count);
      if (row.role === "merchant") usersByRole.merchants = Number(row.count);
      if (row.role === "admin") usersByRole.admins = Number(row.count);
    }

    const nominationsByStatus = {
      submitted: 0,
      changes_requested: 0,
      approved: 0,
      rejected: 0,
    };
    for (const row of nominationsByStatusResult) {
      nominationsByStatus[row.status] = Number(row.count);
    }

    return NextResponse.json({
      summary: {
        totalUsers: Number(totalUsersResult[0]?.count) || 0,
        newUsers: Number(newUsersResult[0]?.count) || 0,
        totalMerchants: Number(totalMerchantsResult[0]?.count) || 0,
        verifiedMerchants: Number(verifiedMerchantsResult[0]?.count) || 0,
        totalReviews: Number(totalReviewsResult[0]?.count) || 0,
        nominations: Number(nominationsResult[0]?.count) || 0,
        confirmedSweepstakesEntries:
          Number(sweepstakesEntriesResult[0]?.count) || 0,
      },
      usersByRole,
      nominationsByStatus,
      merchantsByState: merchantsByStateResult.map((row) => ({
        state: row.state || "Unknown",
        count: Number(row.count),
      })),
      topMerchantsByReviews: topMerchantsByReviewsResult.map((row) => ({
        id: row.id,
        name: row.name,
        reviewCount: Number(row.reviewCount),
      })),
      weeklySignups: weeklySignupsResult.map((row) => ({
        week: row.week,
        total: Number(row.total),
        members: Number(row.members),
        merchants: Number(row.merchants),
      })),
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch analytics",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
