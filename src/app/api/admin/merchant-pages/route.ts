import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  categories,
  merchantOwners,
  merchants,
  reviews,
  users,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import { calculateCompletion } from "@/lib/merchant-completion";
import { revalidateMerchantPublicPaths } from "@/lib/merchant-public-revalidation";
import {
  generateMerchantSlug,
  getMerchantPageUrl,
  getMerchantShortUrl,
  stripPhoneNumber,
} from "@/lib/utils";
import { isValidVimeoUrl } from "@/lib/vimeo";

type MerchantOwner = {
  id: string;
  email: string;
  role: string;
  name: string | null;
};

function formatOwner(row: {
  id: string;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
}): MerchantOwner {
  const name = [row.firstName, row.lastName].filter(Boolean).join(" ");

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    name: name || null,
  };
}

async function getOwnersByMerchant(
  merchantIds: string[],
  legacyUserIdByMerchantId: Map<string, string | null>,
) {
  const ownersByMerchantId = new Map<string, MerchantOwner[]>();

  if (merchantIds.length === 0) {
    return ownersByMerchantId;
  }

  const ownerRows = await db
    .select({
      merchantId: merchantOwners.merchantId,
      id: users.id,
      email: users.email,
      role: users.role,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(merchantOwners)
    .innerJoin(users, eq(merchantOwners.userId, users.id))
    .where(inArray(merchantOwners.merchantId, merchantIds))
    .orderBy(users.email);

  for (const row of ownerRows) {
    const owners = ownersByMerchantId.get(row.merchantId) || [];
    owners.push(formatOwner(row));
    ownersByMerchantId.set(row.merchantId, owners);
  }

  const ownerIdsByMerchantId = new Map<string, Set<string>>();
  for (const merchantId of merchantIds) {
    ownerIdsByMerchantId.set(
      merchantId,
      new Set(
        (ownersByMerchantId.get(merchantId) || []).map((owner) => owner.id),
      ),
    );
  }

  const legacyOwnerIds = Array.from(
    new Set(
      merchantIds
        .map((merchantId) => legacyUserIdByMerchantId.get(merchantId))
        .filter((userId): userId is string => Boolean(userId)),
    ),
  );

  if (legacyOwnerIds.length > 0) {
    const legacyOwners = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(inArray(users.id, legacyOwnerIds));
    const legacyOwnerById = new Map(
      legacyOwners.map((owner) => [owner.id, formatOwner(owner)]),
    );

    for (const merchantId of merchantIds) {
      const legacyUserId = legacyUserIdByMerchantId.get(merchantId);
      const ownerIds = ownerIdsByMerchantId.get(merchantId);

      if (!legacyUserId || ownerIds?.has(legacyUserId)) {
        continue;
      }

      const legacyOwner = legacyOwnerById.get(legacyUserId);
      if (legacyOwner) {
        ownersByMerchantId.set(merchantId, [
          legacyOwner,
          ...(ownersByMerchantId.get(merchantId) || []),
        ]);
      }
    }
  }

  return ownersByMerchantId;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
    );
    const offset = (page - 1) * limit;
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId") || "";
    const completionFilter = searchParams.get("completion") || ""; // "complete", "incomplete", or ""
    const sortBy = searchParams.get("sortBy") || "updatedAt"; // "name", "completion", "updatedAt", "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"; // "asc" or "desc"

    // Build where clauses. Keep unpublished merchant pages in this admin list
    // so admins can turn public visibility back on.
    const managedPageClause = or(
      eq(merchants.isPublicPage, true),
      and(isNotNull(merchants.slug), isNotNull(merchants.phone)),
    );
    if (!managedPageClause) {
      throw new Error("Unable to build merchant page visibility condition");
    }
    const conditions: SQL[] = [managedPageClause];

    if (categoryId) {
      conditions.push(eq(merchants.categoryId, categoryId));
    }

    if (search) {
      const phoneSearch = search.replace(/\D/g, "");
      const searchConditions: SQL[] = [
        ilike(merchants.businessName, `%${search}%`),
        ilike(merchants.city, `%${search}%`),
      ];

      if (phoneSearch) {
        searchConditions.push(
          sql`${merchants.phone} LIKE ${`%${phoneSearch}%`}`,
        );
      }

      const searchClause = or(...searchConditions);
      if (searchClause) {
        conditions.push(searchClause);
      }
    }

    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0];

    // Count query
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(merchants)
      .where(whereClause);

    // Determine sort column and direction
    const getSortColumn = () => {
      switch (sortBy) {
        case "name":
          return merchants.businessName;
        case "updatedAt":
          return merchants.updatedAt;
        case "createdAt":
          return merchants.createdAt;
        default:
          return merchants.updatedAt;
      }
    };
    const orderByClause =
      sortOrder === "asc" ? asc(getSortColumn()) : desc(getSortColumn());

    // For completion sorting/filtering, we need to fetch all and sort in memory
    const needsCompletionSort = sortBy === "completion";
    const needsAllRows = needsCompletionSort || !!completionFilter;

    // Review count subquery
    const reviewCountSq = db
      .select({
        merchantId: reviews.merchantId,
        count: sql<number>`count(*)`.as("review_count"),
      })
      .from(reviews)
      .groupBy(reviews.merchantId)
      .as("review_counts");

    let query = db
      .select({
        id: merchants.id,
        userId: merchants.userId,
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
        isPublicPage: merchants.isPublicPage,
        marketLockStatus: merchants.marketLockStatus,
        description: merchants.description,
        logoUrl: merchants.logoUrl,
        createdAt: merchants.createdAt,
        updatedAt: merchants.updatedAt,
        reviewCount: sql<number>`coalesce(${reviewCountSq.count}, 0)`.as(
          "review_count",
        ),
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
      .leftJoin(reviewCountSq, eq(merchants.id, reviewCountSq.merchantId))
      .where(whereClause)
      .orderBy(orderByClause);

    if (!needsAllRows) {
      query = query.limit(limit).offset(offset) as typeof query;
    }

    const merchantList = await query;
    const legacyUserIdByMerchantId = new Map(
      merchantList.map((merchant) => [merchant.id, merchant.userId]),
    );

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
        isPublicPage: Boolean(m.isPublicPage),
        marketLockStatus: m.marketLockStatus,
        description: m.description,
        logoUrl: m.logoUrl,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
        completionPercentage: completion.percentage,
        reviewCount: Number(m.reviewCount) || 0,
        urls: {
          full:
            m.isPublicPage && m.city && m.state && m.slug
              ? getMerchantPageUrl(m.city, m.state, m.slug)
              : null,
          short:
            m.isPublicPage && m.phone ? getMerchantShortUrl(m.phone) : null,
        },
      };
    });

    // Apply completion filter
    if (completionFilter === "complete") {
      processedMerchants = processedMerchants.filter(
        (m) => m.completionPercentage === 100,
      );
    } else if (completionFilter === "incomplete") {
      processedMerchants = processedMerchants.filter(
        (m) => m.completionPercentage < 100,
      );
    }

    // Sort by completion if requested
    if (sortBy === "completion") {
      processedMerchants.sort((a, b) => {
        const diff = a.completionPercentage - b.completionPercentage;
        return sortOrder === "asc" ? diff : -diff;
      });
    }

    // Calculate totals after filtering
    let filteredTotal: number;
    if (needsAllRows) {
      filteredTotal = processedMerchants.length;
      processedMerchants = processedMerchants.slice(offset, offset + limit);
    } else {
      filteredTotal = Number(count);
    }
    const totalPages = Math.ceil(filteredTotal / limit);

    const ownersByMerchantId = await getOwnersByMerchant(
      processedMerchants.map((merchant) => merchant.id),
      legacyUserIdByMerchantId,
    );
    processedMerchants = processedMerchants.map((merchant) => ({
      ...merchant,
      owners: ownersByMerchantId.get(merchant.id) || [],
    }));

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
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
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
      logoUrl,
      slug,
      hours,
      instagramUrl,
      facebookUrl,
      tiktokUrl,
      photos,
      services,
      aboutStory,
      featuredOnHomepage,
      isPublicPage,
    } = body;

    // Validate required fields
    if (
      !businessName ||
      typeof businessName !== "string" ||
      !businessName.trim()
    ) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 },
      );
    }

    if (!city || typeof city !== "string" || !city.trim()) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }

    if (!state || typeof state !== "string" || state.trim().length !== 2) {
      return NextResponse.json(
        { error: "State must be a 2-letter code" },
        { status: 400 },
      );
    }

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    const strippedPhone = stripPhoneNumber(phone);
    if (strippedPhone.length !== 10) {
      return NextResponse.json(
        { error: "Phone number must be 10 digits" },
        { status: 400 },
      );
    }

    // Validate Vimeo URL if provided
    if (vimeoUrl && !isValidVimeoUrl(vimeoUrl)) {
      return NextResponse.json(
        { error: "Invalid Vimeo URL. Use format: https://vimeo.com/123456789" },
        { status: 400 },
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
          { status: 400 },
        );
      }
    }

    const normalizedCity = city.trim();
    const normalizedState = state.trim().toUpperCase();
    const nextIsPublicPage =
      isPublicPage === undefined ? true : Boolean(isPublicPage);
    const requestedSlug =
      typeof slug === "string"
        ? slug
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
        : "";

    if (requestedSlug) {
      const [existingSlug] = await db
        .select({ id: merchants.id })
        .from(merchants)
        .where(eq(merchants.slug, requestedSlug))
        .limit(1);

      if (existingSlug) {
        return NextResponse.json(
          {
            error:
              "This URL slug is already taken. Please choose a different one.",
          },
          { status: 400 },
        );
      }
    }

    // Create the merchant
    const [newMerchant] = await db
      .insert(merchants)
      .values({
        businessName: businessName.trim(),
        streetAddress: streetAddress?.trim() || null,
        city: normalizedCity,
        state: normalizedState,
        zipCode: zipCode?.trim() || null,
        phone: strippedPhone,
        website: website?.trim() || null,
        categoryId: categoryId || null,
        description: description?.trim() || null,
        vimeoUrl: vimeoUrl?.trim() || null,
        googlePlaceId: googlePlaceId || null,
        logoUrl: logoUrl?.trim() || null,
        hours: hours || null,
        instagramUrl: instagramUrl?.trim() || null,
        facebookUrl: facebookUrl?.trim() || null,
        tiktokUrl: tiktokUrl?.trim() || null,
        photos: Array.isArray(photos) ? photos.filter(Boolean) : null,
        services: Array.isArray(services) ? services : null,
        aboutStory: aboutStory?.trim() || null,
        featuredOnHomepage: Boolean(featuredOnHomepage),
        isPublicPage: nextIsPublicPage,
        verified: false,
      })
      .returning();

    // Generate and update slug (needs ID)
    const finalSlug =
      requestedSlug ||
      generateMerchantSlug(newMerchant.businessName, newMerchant.id);
    await db
      .update(merchants)
      .set({ slug: finalSlug })
      .where(eq(merchants.id, newMerchant.id));

    const fullUrl = getMerchantPageUrl(
      normalizedCity,
      normalizedState,
      finalSlug,
    );
    const shortUrl = getMerchantShortUrl(strippedPhone);

    if (nextIsPublicPage) {
      revalidateMerchantPublicPaths({
        city: normalizedCity,
        state: normalizedState,
        slug: finalSlug,
      });
    }

    return NextResponse.json({
      success: true,
      merchant: {
        id: newMerchant.id,
        businessName: newMerchant.businessName,
        slug: finalSlug,
      },
      urls: {
        full: nextIsPublicPage ? fullUrl : null,
        short: nextIsPublicPage ? shortUrl : null,
      },
    });
  } catch (error) {
    console.error("Error creating merchant page:", error);
    return NextResponse.json(
      { error: "Failed to create merchant page" },
      { status: 500 },
    );
  }
}
