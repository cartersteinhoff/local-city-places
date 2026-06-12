import { and, eq, ne } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, merchantOwners, merchants, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { isMarketLockStatus } from "@/lib/market-lock-status";
import { calculateCompletion } from "@/lib/merchant-completion";
import { revalidateMerchantPublicPaths } from "@/lib/merchant-public-revalidation";
import {
  generateMerchantSlug,
  getMerchantPageUrl,
  getMerchantShortUrl,
  stripPhoneNumber,
} from "@/lib/utils";
import { isValidVimeoUrl } from "@/lib/vimeo";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const [merchant] = await db
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
        description: merchants.description,
        logoUrl: merchants.logoUrl,
        googlePlaceId: merchants.googlePlaceId,
        isPublicPage: merchants.isPublicPage,
        marketLockStatus: merchants.marketLockStatus,
        marketLockStatusUpdatedAt: merchants.marketLockStatusUpdatedAt,
        featuredOnHomepage: merchants.featuredOnHomepage,
        verified: merchants.verified,
        // Extended fields
        hours: merchants.hours,
        instagramUrl: merchants.instagramUrl,
        facebookUrl: merchants.facebookUrl,
        tiktokUrl: merchants.tiktokUrl,
        photos: merchants.photos,
        services: merchants.services,
        aboutStory: merchants.aboutStory,
        campaignAudio: merchants.campaignAudio,
        createdAt: merchants.createdAt,
        updatedAt: merchants.updatedAt,
      })
      .from(merchants)
      .leftJoin(categories, eq(merchants.categoryId, categories.id))
      .where(eq(merchants.id, id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 },
      );
    }

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

    const ownerRows = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(merchantOwners)
      .innerJoin(users, eq(merchantOwners.userId, users.id))
      .where(eq(merchantOwners.merchantId, id))
      .orderBy(users.email);

    const owners = ownerRows.map((owner) => ({
      id: owner.id,
      email: owner.email,
      role: owner.role,
      name: [owner.firstName, owner.lastName].filter(Boolean).join(" ") || null,
    }));
    const ownerIds = new Set(owners.map((owner) => owner.id));

    if (merchant.userId && !ownerIds.has(merchant.userId)) {
      const [legacyOwner] = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(eq(users.id, merchant.userId))
        .limit(1);

      if (legacyOwner) {
        owners.unshift({
          id: legacyOwner.id,
          email: legacyOwner.email,
          role: legacyOwner.role,
          name:
            [legacyOwner.firstName, legacyOwner.lastName]
              .filter(Boolean)
              .join(" ") || null,
        });
      }
    }

    return NextResponse.json({
      merchant: {
        ...merchant,
        owners,
        createdAt: merchant.createdAt.toISOString(),
        updatedAt: merchant.updatedAt.toISOString(),
        urls: {
          full:
            merchant.isPublicPage &&
            merchant.city &&
            merchant.state &&
            merchant.slug
              ? getMerchantPageUrl(merchant.city, merchant.state, merchant.slug)
              : null,
          short:
            merchant.isPublicPage && merchant.phone
              ? getMerchantShortUrl(merchant.phone)
              : null,
        },
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
    });
  } catch (error) {
    console.error("Error fetching merchant:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchant" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
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
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 },
      );
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
      // Extended fields
      hours,
      instagramUrl,
      facebookUrl,
      tiktokUrl,
      photos,
      services,
      aboutStory,
      featuredOnHomepage,
      isPublicPage,
      marketLockStatus,
      signatureTracksEnabled,
    } = body;

    // Build update object
    const updates: Partial<typeof merchants.$inferInsert> = {};

    if (businessName !== undefined) {
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
      updates.businessName = businessName.trim();
    }

    if (streetAddress !== undefined) {
      updates.streetAddress = streetAddress?.trim() || null;
    }

    if (city !== undefined) {
      if (!city || typeof city !== "string" || !city.trim()) {
        return NextResponse.json(
          { error: "City is required" },
          { status: 400 },
        );
      }
      updates.city = city.trim();
    }

    if (state !== undefined) {
      if (!state || typeof state !== "string" || state.trim().length !== 2) {
        return NextResponse.json(
          { error: "State must be a 2-letter code" },
          { status: 400 },
        );
      }
      updates.state = state.trim().toUpperCase();
    }

    if (zipCode !== undefined) {
      updates.zipCode = zipCode?.trim() || null;
    }

    if (phone !== undefined) {
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
            { status: 400 },
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
          {
            error: "Invalid Vimeo URL. Use format: https://vimeo.com/123456789",
          },
          { status: 400 },
        );
      }
      updates.vimeoUrl = vimeoUrl?.trim() || null;
    }

    if (googlePlaceId !== undefined) {
      updates.googlePlaceId = googlePlaceId || null;
    }

    if (logoUrl !== undefined) {
      updates.logoUrl = logoUrl?.trim() || null;
    }

    // Extended fields
    if (hours !== undefined) {
      updates.hours = hours || null;
    }

    if (instagramUrl !== undefined) {
      updates.instagramUrl = instagramUrl?.trim() || null;
    }

    if (facebookUrl !== undefined) {
      updates.facebookUrl = facebookUrl?.trim() || null;
    }

    if (tiktokUrl !== undefined) {
      updates.tiktokUrl = tiktokUrl?.trim() || null;
    }

    if (photos !== undefined) {
      updates.photos = Array.isArray(photos) ? photos.filter(Boolean) : null;
    }

    if (services !== undefined) {
      updates.services = Array.isArray(services) ? services : null;
    }

    if (aboutStory !== undefined) {
      updates.aboutStory = aboutStory?.trim() || null;
    }

    if (featuredOnHomepage !== undefined) {
      updates.featuredOnHomepage = Boolean(featuredOnHomepage);
    }

    if (marketLockStatus !== undefined) {
      if (!isMarketLockStatus(marketLockStatus)) {
        return NextResponse.json(
          { error: "Invalid MarketLock status" },
          { status: 400 },
        );
      }

      updates.marketLockStatus = marketLockStatus;
      if (marketLockStatus !== existing.marketLockStatus) {
        updates.marketLockStatusUpdatedAt = new Date();
      }
    }

    if (signatureTracksEnabled !== undefined) {
      updates.campaignAudio = {
        ...(existing.campaignAudio || {}),
        showOnProfile: Boolean(signatureTracksEnabled),
      };
    }

    if (isPublicPage !== undefined) {
      const nextIsPublicPage = Boolean(isPublicPage);
      const nextCity = updates.city ?? existing.city;
      const nextState = updates.state ?? existing.state;
      const nextPhone = updates.phone ?? existing.phone;
      const nextSlug =
        slug !== undefined
          ? String(slug)
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9-]/g, "-")
              .replace(/-+/g, "-")
              .replace(/^-|-$/g, "")
          : existing.slug;

      if (
        nextIsPublicPage &&
        (!nextCity || !nextState || !nextPhone || !nextSlug)
      ) {
        return NextResponse.json(
          {
            error:
              "City, state, phone, and URL slug are required before making this page public.",
          },
          { status: 400 },
        );
      }

      updates.isPublicPage = nextIsPublicPage;
    }

    // Handle custom slug or regenerate if business name changed and no custom slug
    if (slug !== undefined) {
      // Custom slug provided - sanitize it
      const sanitizedSlug = slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      if (sanitizedSlug && sanitizedSlug !== existing.slug) {
        // Check if slug is already taken by another merchant
        const [existingSlug] = await db
          .select({ id: merchants.id })
          .from(merchants)
          .where(and(eq(merchants.slug, sanitizedSlug), ne(merchants.id, id)))
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
        updates.slug = sanitizedSlug;
      }
    } else if (updates.businessName && !existing.slug) {
      // Only auto-generate slug if business name changed AND no slug exists yet
      updates.slug = generateMerchantSlug(updates.businessName, id);
    }

    // Perform update
    if (Object.keys(updates).length > 0) {
      await db
        .update(merchants)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(merchants.id, id));
    }

    // Fetch updated merchant
    const [updated] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, id))
      .limit(1);

    const fullUrl =
      updated.city && updated.state && updated.slug
        ? getMerchantPageUrl(updated.city, updated.state, updated.slug)
        : null;
    const shortUrl = updated.phone ? getMerchantShortUrl(updated.phone) : null;

    revalidateMerchantPublicPaths(existing, updated);

    return NextResponse.json({
      success: true,
      merchant: {
        id: updated.id,
        businessName: updated.businessName,
        slug: updated.slug,
        isPublicPage: Boolean(updated.isPublicPage),
        marketLockStatus: updated.marketLockStatus,
      },
      urls: {
        full: updated.isPublicPage ? fullUrl : null,
        short: updated.isPublicPage ? shortUrl : null,
      },
    });
  } catch (error) {
    console.error("Error updating merchant:", error);
    return NextResponse.json(
      { error: "Failed to update merchant" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
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
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 },
      );
    }

    // Only allow deletion of public page merchants (admin-created)
    if (!existing.isPublicPage) {
      return NextResponse.json(
        {
          error:
            "Cannot delete merchant accounts. Only public pages can be deleted.",
        },
        { status: 400 },
      );
    }

    // Delete the merchant
    await db.delete(merchants).where(eq(merchants.id, id));

    revalidateMerchantPublicPaths(existing);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting merchant:", error);
    return NextResponse.json(
      { error: "Failed to delete merchant" },
      { status: 500 },
    );
  }
}
