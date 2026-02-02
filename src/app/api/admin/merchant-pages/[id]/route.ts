import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { merchants, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { isValidVimeoUrl } from "@/lib/vimeo";
import {
  stripPhoneNumber,
  generateMerchantSlug,
  getMerchantPageUrl,
  getMerchantShortUrl,
} from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const [merchant] = await db
      .select({
        id: merchants.id,
        businessName: merchants.businessName,
        city: merchants.city,
        state: merchants.state,
        phone: merchants.phone,
        website: merchants.website,
        vimeoUrl: merchants.vimeoUrl,
        slug: merchants.slug,
        categoryId: merchants.categoryId,
        categoryName: categories.name,
        description: merchants.description,
        logoUrl: merchants.logoUrl,
        googlePlaceId: merchants.googlePlaceId,
        isPublicPage: merchants.isPublicPage,
        createdAt: merchants.createdAt,
      })
      .from(merchants)
      .leftJoin(categories, eq(merchants.categoryId, categories.id))
      .where(eq(merchants.id, id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    return NextResponse.json({
      merchant: {
        ...merchant,
        createdAt: merchant.createdAt.toISOString(),
        urls: {
          full: merchant.city && merchant.state && merchant.slug
            ? getMerchantPageUrl(merchant.city, merchant.state, merchant.slug)
            : null,
          short: merchant.phone ? getMerchantShortUrl(merchant.phone) : null,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching merchant:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchant" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    // Check merchant exists
    const [existing] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      businessName,
      city,
      state,
      phone,
      website,
      categoryId,
      description,
      vimeoUrl,
      googlePlaceId,
    } = body;

    // Build update object
    const updates: Partial<typeof merchants.$inferInsert> = {};

    if (businessName !== undefined) {
      if (!businessName || typeof businessName !== "string" || !businessName.trim()) {
        return NextResponse.json(
          { error: "Business name is required" },
          { status: 400 }
        );
      }
      updates.businessName = businessName.trim();
    }

    if (city !== undefined) {
      if (!city || typeof city !== "string" || !city.trim()) {
        return NextResponse.json(
          { error: "City is required" },
          { status: 400 }
        );
      }
      updates.city = city.trim();
    }

    if (state !== undefined) {
      if (!state || typeof state !== "string" || state.trim().length !== 2) {
        return NextResponse.json(
          { error: "State must be a 2-letter code" },
          { status: 400 }
        );
      }
      updates.state = state.trim().toUpperCase();
    }

    if (phone !== undefined) {
      if (!phone || typeof phone !== "string") {
        return NextResponse.json(
          { error: "Phone number is required" },
          { status: 400 }
        );
      }
      const strippedPhone = stripPhoneNumber(phone);
      if (strippedPhone.length !== 10) {
        return NextResponse.json(
          { error: "Phone number must be 10 digits" },
          { status: 400 }
        );
      }
      updates.phone = strippedPhone;
    }

    if (website !== undefined) {
      updates.website = website?.trim() || null;
    }

    if (categoryId !== undefined) {
      if (categoryId) {
        const [category] = await db
          .select()
          .from(categories)
          .where(eq(categories.id, categoryId))
          .limit(1);

        if (!category) {
          return NextResponse.json(
            { error: "Invalid category" },
            { status: 400 }
          );
        }
      }
      updates.categoryId = categoryId || null;
    }

    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    if (vimeoUrl !== undefined) {
      if (vimeoUrl && !isValidVimeoUrl(vimeoUrl)) {
        return NextResponse.json(
          { error: "Invalid Vimeo URL. Use format: https://vimeo.com/123456789" },
          { status: 400 }
        );
      }
      updates.vimeoUrl = vimeoUrl?.trim() || null;
    }

    if (googlePlaceId !== undefined) {
      updates.googlePlaceId = googlePlaceId || null;
    }

    // Regenerate slug if business name changed
    if (updates.businessName) {
      updates.slug = generateMerchantSlug(updates.businessName, id);
    }

    // Perform update
    if (Object.keys(updates).length > 0) {
      await db.update(merchants).set(updates).where(eq(merchants.id, id));
    }

    // Fetch updated merchant
    const [updated] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, id))
      .limit(1);

    const fullUrl = updated.city && updated.state && updated.slug
      ? getMerchantPageUrl(updated.city, updated.state, updated.slug)
      : null;
    const shortUrl = updated.phone ? getMerchantShortUrl(updated.phone) : null;

    return NextResponse.json({
      success: true,
      merchant: {
        id: updated.id,
        businessName: updated.businessName,
        slug: updated.slug,
      },
      urls: {
        full: fullUrl,
        short: shortUrl,
      },
    });
  } catch (error) {
    console.error("Error updating merchant:", error);
    return NextResponse.json(
      { error: "Failed to update merchant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    // Check merchant exists
    const [existing] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // Only allow deletion of public page merchants (admin-created)
    if (!existing.isPublicPage) {
      return NextResponse.json(
        { error: "Cannot delete merchant accounts. Only public pages can be deleted." },
        { status: 400 }
      );
    }

    // Delete the merchant
    await db.delete(merchants).where(eq(merchants.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting merchant:", error);
    return NextResponse.json(
      { error: "Failed to delete merchant" },
      { status: 500 }
    );
  }
}
