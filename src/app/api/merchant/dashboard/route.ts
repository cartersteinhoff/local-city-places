import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { categories, db, merchants, reviews } from "@/db";
import { getSession } from "@/lib/auth";
import { calculateCompletion } from "@/lib/merchant-completion";

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
      .select({
        id: merchants.id,
        businessName: merchants.businessName,
        categoryId: merchants.categoryId,
        categoryName: categories.name,
        isPublicPage: merchants.isPublicPage,
        verified: merchants.verified,
        streetAddress: merchants.streetAddress,
        city: merchants.city,
        state: merchants.state,
        zipCode: merchants.zipCode,
        slug: merchants.slug,
        logoUrl: merchants.logoUrl,
        description: merchants.description,
        phone: merchants.phone,
        website: merchants.website,
        aboutStory: merchants.aboutStory,
        hours: merchants.hours,
        instagramUrl: merchants.instagramUrl,
        facebookUrl: merchants.facebookUrl,
        tiktokUrl: merchants.tiktokUrl,
        vimeoUrl: merchants.vimeoUrl,
        photos: merchants.photos,
        services: merchants.services,
        updatedAt: merchants.updatedAt,
      })
      .from(merchants)
      .leftJoin(categories, eq(merchants.categoryId, categories.id))
      .where(eq(merchants.userId, session.user.id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 },
      );
    }

    const [reviewStats] = await db
      .select({
        totalReviews: sql<number>`count(*)::int`,
        avgWordCount: sql<number>`coalesce(avg(${reviews.wordCount}), 0)::int`,
      })
      .from(reviews)
      .where(eq(reviews.merchantId, merchant.id));

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

    const completion = calculateCompletion({
      businessName: merchant.businessName,
      categoryId: merchant.categoryId || undefined,
      description: merchant.description || undefined,
      aboutStory: merchant.aboutStory || undefined,
      streetAddress: merchant.streetAddress || undefined,
      city: merchant.city || undefined,
      state: merchant.state || undefined,
      zipCode: merchant.zipCode || undefined,
      phone: merchant.phone || undefined,
      website: merchant.website || undefined,
      instagramUrl: merchant.instagramUrl || undefined,
      facebookUrl: merchant.facebookUrl || undefined,
      tiktokUrl: merchant.tiktokUrl || undefined,
      hours: merchant.hours || undefined,
      logoUrl: merchant.logoUrl || undefined,
      vimeoUrl: merchant.vimeoUrl || undefined,
      photos: merchant.photos || undefined,
      services: merchant.services || undefined,
    });

    return NextResponse.json({
      merchant: {
        id: merchant.id,
        businessName: merchant.businessName,
        categoryId: merchant.categoryId,
        categoryName: merchant.categoryName,
        isPublicPage: merchant.isPublicPage,
        verified: merchant.verified,
        city: merchant.city,
        state: merchant.state,
        slug: merchant.slug,
        logoUrl: merchant.logoUrl,
        description: merchant.description,
        phone: merchant.phone,
        website: merchant.website,
        photoCount: merchant.photos?.length || 0,
        updatedAt: merchant.updatedAt.toISOString(),
      },
      pageManagement: {
        completionPercentage: completion.percentage,
        completedFields: completion.completed,
        totalFields: completion.total,
        missingSections: completion.sections
          .filter((section) => section.missingFields.length > 0)
          .map((section) => ({
            label: section.label,
            missingFields: section.missingFields,
          }))
          .slice(0, 3),
      },
      stats: {
        totalReviews: Number(reviewStats?.totalReviews) || 0,
        avgWordCount: Number(reviewStats?.avgWordCount) || 0,
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
