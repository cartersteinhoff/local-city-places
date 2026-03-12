import { NextResponse } from "next/server";
import { db } from "@/db";
import { merchants, categories } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const featured = await db
      .select({
        id: merchants.id,
        businessName: merchants.businessName,
        city: merchants.city,
        state: merchants.state,
        slug: merchants.slug,
        logoUrl: merchants.logoUrl,
        photos: merchants.photos,
        categoryName: categories.name,
      })
      .from(merchants)
      .leftJoin(categories, eq(merchants.categoryId, categories.id))
      .where(
        and(
          eq(merchants.featuredOnHomepage, true),
          eq(merchants.isPublicPage, true)
        )
      );

    return NextResponse.json({ merchants: featured });
  } catch (error) {
    console.error("Error fetching featured merchants:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured merchants" },
      { status: 500 }
    );
  }
}
