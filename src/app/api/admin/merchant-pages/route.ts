import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { merchants, categories } from "@/db/schema";
import { eq, desc, sql, like, or } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { isValidVimeoUrl } from "@/lib/vimeo";
import {
  stripPhoneNumber,
  generateMerchantSlug,
  getMerchantPageUrl,
  getMerchantShortUrl,
} from "@/lib/utils";

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
    const search = searchParams.get("search") || "";

    // Build where clause for public pages only
    let whereClause = eq(merchants.isPublicPage, true);

    // Count query
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(merchants)
      .where(whereClause);

    // If search provided, filter by business name, city, or phone
    let query = db
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
        createdAt: merchants.createdAt,
      })
      .from(merchants)
      .leftJoin(categories, eq(merchants.categoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(merchants.createdAt))
      .limit(limit)
      .offset(offset);

    const merchantList = await query;

    // Apply search filter in application if provided
    let filteredMerchants = merchantList;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredMerchants = merchantList.filter(
        (m) =>
          m.businessName.toLowerCase().includes(searchLower) ||
          m.city?.toLowerCase().includes(searchLower) ||
          m.phone?.includes(search)
      );
    }

    const totalPages = Math.ceil(Number(count) / limit);

    return NextResponse.json({
      merchants: filteredMerchants.map((m) => ({
        id: m.id,
        businessName: m.businessName,
        city: m.city,
        state: m.state,
        phone: m.phone,
        website: m.website,
        vimeoUrl: m.vimeoUrl,
        slug: m.slug,
        categoryId: m.categoryId,
        categoryName: m.categoryName,
        description: m.description,
        logoUrl: m.logoUrl,
        createdAt: m.createdAt.toISOString(),
        urls: {
          full: m.city && m.state && m.slug ? getMerchantPageUrl(m.city, m.state, m.slug) : null,
          short: m.phone ? getMerchantShortUrl(m.phone) : null,
        },
      })),
      pagination: {
        total: Number(count),
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching merchant pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchant pages" },
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

    // Validate required fields
    if (!businessName || typeof businessName !== "string" || !businessName.trim()) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      );
    }

    if (!city || typeof city !== "string" || !city.trim()) {
      return NextResponse.json(
        { error: "City is required" },
        { status: 400 }
      );
    }

    if (!state || typeof state !== "string" || state.trim().length !== 2) {
      return NextResponse.json(
        { error: "State must be a 2-letter code" },
        { status: 400 }
      );
    }

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

    // Validate Vimeo URL if provided
    if (vimeoUrl && !isValidVimeoUrl(vimeoUrl)) {
      return NextResponse.json(
        { error: "Invalid Vimeo URL. Use format: https://vimeo.com/123456789" },
        { status: 400 }
      );
    }

    // Validate category if provided
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

    // Create the merchant
    const [newMerchant] = await db
      .insert(merchants)
      .values({
        businessName: businessName.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        phone: strippedPhone,
        website: website?.trim() || null,
        categoryId: categoryId || null,
        description: description?.trim() || null,
        vimeoUrl: vimeoUrl?.trim() || null,
        googlePlaceId: googlePlaceId || null,
        isPublicPage: true,
        verified: false,
      })
      .returning();

    // Generate and update slug (needs ID)
    const slug = generateMerchantSlug(newMerchant.businessName, newMerchant.id);
    await db
      .update(merchants)
      .set({ slug })
      .where(eq(merchants.id, newMerchant.id));

    const fullUrl = getMerchantPageUrl(newMerchant.city!, newMerchant.state!, slug);
    const shortUrl = getMerchantShortUrl(strippedPhone);

    return NextResponse.json({
      success: true,
      merchant: {
        id: newMerchant.id,
        businessName: newMerchant.businessName,
        slug,
      },
      urls: {
        full: fullUrl,
        short: shortUrl,
      },
    });
  } catch (error) {
    console.error("Error creating merchant page:", error);
    return NextResponse.json(
      { error: "Failed to create merchant page" },
      { status: 500 }
    );
  }
}
