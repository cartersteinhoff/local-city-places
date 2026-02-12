import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews, merchants, reviewPhotos } from "@/db/schema";
import { eq, desc, sql, and, isNull, isNotNull, ilike, or } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";
    const source = searchParams.get("source") || ""; // "migrated", "member", or ""

    // Build where conditions
    const conditions: any[] = [];

    if (status && status !== "all") {
      conditions.push(eq(reviews.status, status as "pending" | "approved" | "rejected"));
    }

    if (source === "migrated") {
      conditions.push(isNull(reviews.memberId));
    } else if (source === "member") {
      conditions.push(isNotNull(reviews.memberId));
    }

    if (search) {
      conditions.push(
        or(
          ilike(reviews.reviewerFirstName, `%${search}%`),
          ilike(reviews.reviewerLastName, `%${search}%`),
          ilike(reviews.content, `%${search}%`),
          ilike(merchants.businessName, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Photo count subquery
    const photoCountSq = db
      .select({
        reviewId: reviewPhotos.reviewId,
        count: sql<number>`count(*)`.as("photo_count"),
      })
      .from(reviewPhotos)
      .groupBy(reviewPhotos.reviewId)
      .as("photo_counts");

    // Count query
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .leftJoin(merchants, eq(reviews.merchantId, merchants.id))
      .where(whereClause);

    const totalPages = Math.ceil(Number(count) / limit);

    // Data query
    const reviewList = await db
      .select({
        id: reviews.id,
        content: reviews.content,
        rating: reviews.rating,
        status: reviews.status,
        reviewerFirstName: reviews.reviewerFirstName,
        reviewerLastName: reviews.reviewerLastName,
        reviewerPhotoUrl: reviews.reviewerPhotoUrl,
        memberId: reviews.memberId,
        merchantId: reviews.merchantId,
        merchantName: merchants.businessName,
        createdAt: reviews.createdAt,
        photoCount: sql<number>`coalesce(${photoCountSq.count}, 0)`,
      })
      .from(reviews)
      .leftJoin(merchants, eq(reviews.merchantId, merchants.id))
      .leftJoin(photoCountSq, eq(reviews.id, photoCountSq.reviewId))
      .where(whereClause)
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);

    // Stats query (unfiltered)
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`count(*) filter (where ${reviews.status} = 'pending')`,
        approved: sql<number>`count(*) filter (where ${reviews.status} = 'approved')`,
        rejected: sql<number>`count(*) filter (where ${reviews.status} = 'rejected')`,
      })
      .from(reviews);

    return NextResponse.json({
      reviews: reviewList.map((r) => ({
        ...r,
        photoCount: Number(r.photoCount) || 0,
        source: r.memberId ? "member" : "migrated",
        createdAt: r.createdAt.toISOString(),
      })),
      pagination: {
        total: Number(count),
        page,
        limit,
        totalPages,
      },
      stats: {
        total: Number(stats.total),
        pending: Number(stats.pending),
        approved: Number(stats.approved),
        rejected: Number(stats.rejected),
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
