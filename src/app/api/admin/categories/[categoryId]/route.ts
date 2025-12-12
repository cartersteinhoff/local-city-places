import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, merchants } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { categoryId } = await params;
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Check if category exists
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check if another category already has this name
    const duplicate = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.name, name.trim()),
          ne(categories.id, categoryId)
        )
      )
      .limit(1);

    if (duplicate.length > 0) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 400 }
      );
    }

    // Update category
    const [updated] = await db
      .update(categories)
      .set({ name: name.trim() })
      .where(eq(categories.id, categoryId))
      .returning();

    return NextResponse.json({
      category: {
        id: updated.id,
        name: updated.name,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { categoryId } = await params;

    // Check if category exists
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check if merchants are using this category
    const merchantsUsingCategory = await db
      .select()
      .from(merchants)
      .where(eq(merchants.categoryId, categoryId))
      .limit(1);

    if (merchantsUsingCategory.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete category that has merchants assigned to it" },
        { status: 400 }
      );
    }

    // Delete category
    await db
      .delete(categories)
      .where(eq(categories.id, categoryId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
