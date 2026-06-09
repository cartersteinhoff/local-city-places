import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, merchants, reviews, users } from "@/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [totalUsersResult, activeMerchantsResult, totalReviewsResult] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(users),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(merchants)
          .where(eq(merchants.verified, true)),
        db.select({ count: sql<number>`count(*)::int` }).from(reviews),
      ]);

    return NextResponse.json({
      stats: {
        totalUsers: Number(totalUsersResult[0]?.count) || 0,
        activeMerchants: Number(activeMerchantsResult[0]?.count) || 0,
        totalReviews: Number(totalReviewsResult[0]?.count) || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}
