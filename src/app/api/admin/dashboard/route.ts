import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  db,
  favoriteMerchantTestimonials,
  merchants,
  reviews,
  users,
} from "@/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [
      totalUsersResult,
      activeMerchantsResult,
      totalReviewsResult,
      pendingNominationsResult,
      recentNominations,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(merchants)
        .where(eq(merchants.verified, true)),
      db.select({ count: sql<number>`count(*)::int` }).from(reviews),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(favoriteMerchantTestimonials)
        .where(eq(favoriteMerchantTestimonials.status, "submitted")),
      db
        .select({
          id: favoriteMerchantTestimonials.id,
          status: favoriteMerchantTestimonials.status,
          wordCount: favoriteMerchantTestimonials.wordCount,
          createdAt: favoriteMerchantTestimonials.createdAt,
          updatedAt: favoriteMerchantTestimonials.updatedAt,
          merchantName: merchants.businessName,
        })
        .from(favoriteMerchantTestimonials)
        .innerJoin(
          merchants,
          eq(favoriteMerchantTestimonials.merchantId, merchants.id),
        )
        .orderBy(desc(favoriteMerchantTestimonials.updatedAt))
        .limit(8),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers: Number(totalUsersResult[0]?.count) || 0,
        activeMerchants: Number(activeMerchantsResult[0]?.count) || 0,
        totalReviews: Number(totalReviewsResult[0]?.count) || 0,
        pendingNominations: Number(pendingNominationsResult[0]?.count) || 0,
      },
      recentActivity: recentNominations.map((nomination) => ({
        id: nomination.id,
        type: "merchant_nomination",
        merchantName: nomination.merchantName,
        status: nomination.status,
        wordCount: nomination.wordCount,
        timestamp: nomination.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}
