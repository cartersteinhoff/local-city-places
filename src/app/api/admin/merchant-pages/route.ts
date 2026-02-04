import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { merchants, categories } from "@/db/schema";
import { eq, desc, asc, sql, and, isNull, isNotNull } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { isValidVimeoUrl } from "@/lib/vimeo";
import {
  stripPhoneNumber,
  generateMerchantSlug,
  getMerchantPageUrl,
  getMerchantShortUrl,
} from "@/lib/utils";
import { calculateCompletion } from "@/lib/merchant-completion";

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
    const categoryId = searchParams.get("categoryId") || "";
    const completionFilter = searchParams.get("completion") || ""; // "complete", "incomplete", or ""
    const sortBy = searchParams.get("sortBy") || "updatedAt"; // "name", "completion", "updatedAt", "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"; // "asc" or "desc"

    // Build where clauses
    const conditions = [eq(merchants.isPublicPage, true)];

    if (categoryId) {
      conditions.push(eq(merchants.categoryId, categoryId));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Count query
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(merchants)
      .where(whereClause);

    // Determine sort column and direction
    const getSortColumn = () => {
      switch (sortBy) {
        case "name": return merchants.businessName;
        case "updatedAt": return merchants.updatedAt;
        case "createdAt": return merchants.createdAt;
        default: return merchants.updatedAt;
      }
    };
    const orderByClause = sortOrder === "asc" ? asc(getSortColumn()) : desc(getSortColumn());

    // For completion sorting, we need to fetch all and sort in memory
    const needsCompletionSort = sortBy === "completion";
    const queryLimit = needsCompletionSort || completionFilter ? 1000 : limit;
    const queryOffset = needsCompletionSort || completionFilter ? 0 : offset;

    let query = db
      .select({
        id: merchants.id,
        businessName: merchants.businessName,
        streetAddress: merchants.streetAddress,
        city: merchants.city,
        state: merchants.state,
        zipCode: merchants.zipCode,
        phone: merchants.phone,
        website: merchants.website,
        vimeoUrl: merchants.vimeoUrl,
        slug: merchants.slug,
        categoryId: merchants.categoryId,
        categoryName: categories.name,
        description: merchants.description,
        logoUrl: merchants.logoUrl,
        createdAt: merchants.createdAt,
        updatedAt: merchants.updatedAt,
        // Additional fields for completion calculation
        aboutStory: merchants.aboutStory,
        hours: merchants.hours,
        instagramUrl: merchants.instagramUrl,
        facebookUrl: merchants.facebookUrl,
        tiktokUrl: merchants.tiktokUrl,
        photos: merchants.photos,
        services: merchants.services,
      })
      .from(merchants)
      .leftJoin(categories, eq(merchants.categoryId, categories.id))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(queryLimit)
      .offset(queryOffset);

    const merchantList = await query;

    // Transform merchants with completion calculation
    let processedMerchants = merchantList.map((m) => {
      const completion = calculateCompletion({
        businessName: m.businessName,
        categoryId: m.categoryId || undefined,
        description: m.description || undefined,
        aboutStory: m.aboutStory || undefined,
        streetAddress: m.streetAddress || undefined,
        city: m.city || undefined,
        state: m.state || undefined,
        zipCode: m.zipCode || undefined,
        phone: m.phone || undefined,
        website: m.website || undefined,
        instagramUrl: m.instagramUrl || undefined,
        facebookUrl: m.facebookUrl || undefined,
        tiktokUrl: m.tiktokUrl || undefined,
        hours: m.hours || undefined,
        logoUrl: m.logoUrl || undefined,
        vimeoUrl: m.vimeoUrl || undefined,
        photos: m.photos || undefined,
        services: m.services || undefined,
      });

      return {
        id: m.id,
        businessName: m.businessName,
        streetAddress: m.streetAddress,
        city: m.city,
        state: m.state,
        zipCode: m.zipCode,
        phone: m.phone,
        website: m.website,
        vimeoUrl: m.vimeoUrl,
        slug: m.slug,
        categoryId: m.categoryId,
        categoryName: m.categoryName,
        description: m.description,
        logoUrl: m.logoUrl,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
        completionPercentage: completion.percentage,
        urls: {
          full: m.city && m.state && m.slug ? getMerchantPageUrl(m.city, m.state, m.slug) : null,
          short: m.phone ? getMerchantShortUrl(m.phone) : null,
        },
      };
    });

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      processedMerchants = processedMerchants.filter(
        (m) =>
          m.businessName.toLowerCase().includes(searchLower) ||
          m.city?.toLowerCase().includes(searchLower) ||
          m.phone?.includes(search)
      );
    }

    // Apply completion filter
    if (completionFilter === "complete") {
      processedMerchants = processedMerchants.filter((m) => m.completionPercentage === 100);
    } else if (completionFilter === "incomplete") {
      processedMerchants = processedMerchants.filter((m) => m.completionPercentage < 100);
    }

    // Sort by completion if requested
    if (sortBy === "completion") {
      processedMerchants.sort((a, b) => {
        const diff = a.completionPercentage - b.completionPercentage;
        return sortOrder === "asc" ? diff : -diff;
      });
    }

    // Calculate totals after filtering
    const filteredTotal = processedMerchants.length;
    const totalPages = Math.ceil(filteredTotal / limit);

    // Apply pagination if we fetched all for sorting/filtering
    if (needsCompletionSort || completionFilter) {
      processedMerchants = processedMerchants.slice(offset, offset + limit);
    }

    return NextResponse.json({
      merchants: processedMerchants,
      pagination: {
        total: filteredTotal,
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
      streetAddress,
      city,
      state,
      zipCode,
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
        streetAddress: streetAddress?.trim() || null,
        city: city.trim(),
        state: state.trim().toUpperCase(),
        zipCode: zipCode?.trim() || null,
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
