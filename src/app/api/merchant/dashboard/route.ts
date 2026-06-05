import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, merchants, reviews, surveys } from "@/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (
      !session ||
      (session.user.role !== "merchant" && session.user.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, session.user.id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const [reviewStats] = await db
      .select({
        totalReviews: sql<number>`count(*)::int`,
        avgWordCount: sql<number>`coalesce(avg(${reviews.wordCount}), 0)::int`,
      })
      .from(reviews)
      .where(eq(reviews.merchantId, merchant.id));

    const [surveyStats] = await db
      .select({
        totalSurveys: sql<number>`count(*)::int`,
        activeSurveys: sql<number>`count(*) filter (where ${surveys.isActive} = true)::int`,
      })
      .from(surveys)
      .where(eq(surveys.merchantId, merchant.id));

    const recentReviews = await db
      .select({
        id: reviews.id,
        content: reviews.content,
        wordCount: reviews.wordCount,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(eq(reviews.merchantId, merchant.id))
      .orderBy(desc(reviews.createdAt))
      .limit(5);

    return NextResponse.json({
      merchant: {
        id: merchant.id,
        businessName: merchant.businessName,
        isPublicPage: merchant.isPublicPage,
        verified: merchant.verified,
        city: merchant.city,
        state: merchant.state,
        slug: merchant.slug,
      },
      stats: {
        totalReviews: Number(reviewStats?.totalReviews) || 0,
        avgWordCount: Number(reviewStats?.avgWordCount) || 0,
        totalSurveys: Number(surveyStats?.totalSurveys) || 0,
        activeSurveys: Number(surveyStats?.activeSurveys) || 0,
      },
      recentReviews: recentReviews.map((review) => ({
        id: review.id,
        content: review.content,
        wordCount: review.wordCount,
        createdAt: review.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
