import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, reviews, merchants, members } from "@/db";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== "merchant" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get merchant
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, session.user.id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviews)
      .where(eq(reviews.merchantId, merchant.id));

    const total = countResult?.count || 0;

    // Get reviews with member info
    const reviewsRaw = await db
      .select({
        id: reviews.id,
        content: reviews.content,
        wordCount: reviews.wordCount,
        bonusMonthAwarded: reviews.bonusMonthAwarded,
        createdAt: reviews.createdAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
      })
      .from(reviews)
      .leftJoin(members, eq(reviews.memberId, members.id))
      .where(eq(reviews.merchantId, merchant.id))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);

    // Calculate stats
    const avgWordCount =
      reviewsRaw.length > 0
        ? Math.round(reviewsRaw.reduce((sum, r) => sum + r.wordCount, 0) / reviewsRaw.length)
        : 0;

    // Since we don't have ratings, we'll use word count as a proxy for "quality"
    // Reviews with 100+ words are considered "detailed/positive"
    const detailedReviews = reviewsRaw.filter((r) => r.wordCount >= 75).length;
    const detailedPercent = total > 0 ? Math.round((detailedReviews / total) * 100) : 0;

    const formattedReviews = reviewsRaw.map((r) => ({
      id: r.id,
      memberName:
        r.memberFirstName && r.memberLastName
          ? `${r.memberFirstName} ${r.memberLastName.charAt(0)}.`
          : "Anonymous",
      content: r.content,
      wordCount: r.wordCount,
      bonusMonthAwarded: r.bonusMonthAwarded,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({
      stats: {
        totalReviews: total,
        avgWordCount,
        detailedPercent,
      },
      reviews: formattedReviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Reviews API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
