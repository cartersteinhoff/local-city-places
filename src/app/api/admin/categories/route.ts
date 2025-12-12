import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, merchants } from "@/db/schema";
import { eq, sql, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get categories with merchant count
    const categoriesWithCount = await db
      .select({
        id: categories.id,
        name: categories.name,
        createdAt: categories.createdAt,
        merchantCount: sql<number>`count(${merchants.id})`.as("merchant_count"),
      })
      .from(categories)
      .leftJoin(merchants, eq(merchants.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(asc(categories.name));

    return NextResponse.json({
      categories: categoriesWithCount.map((c) => ({
        id: c.id,
        name: c.name,
        createdAt: c.createdAt.toISOString(),
        merchantCount: Number(c.merchantCount),
      })),
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.name, name.trim()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 400 }
      );
    }

    // Create category
    const [newCategory] = await db
      .insert(categories)
      .values({
        name: name.trim(),
      })
      .returning();

    return NextResponse.json({
      category: {
        id: newCategory.id,
        name: newCategory.name,
        createdAt: newCategory.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
