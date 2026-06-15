import { and, desc, eq, ilike, inArray, or, type SQL, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, merchantOwners, merchants, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getMerchantPageUrl } from "@/lib/utils";

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

    const conditions: SQL[] = [
      eq(merchants.marketLockStatus, "trial_requested"),
    ];

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

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(merchants)
      .where(whereClause);

    const trialRows = await db
      .select({
        id: merchants.id,
        userId: merchants.userId,
        businessName: merchants.businessName,
        categoryName: categories.name,
        city: merchants.city,
        state: merchants.state,
        phone: merchants.phone,
        website: merchants.website,
        slug: merchants.slug,
        isPublicPage: merchants.isPublicPage,
        marketLockStatusUpdatedAt: merchants.marketLockStatusUpdatedAt,
        updatedAt: merchants.updatedAt,
        createdAt: merchants.createdAt,
      })
      .from(merchants)
      .leftJoin(categories, eq(merchants.categoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(merchants.marketLockStatusUpdatedAt))
      .limit(limit)
      .offset(offset);

    const legacyUserIdByMerchantId = new Map(
      trialRows.map((merchant) => [merchant.id, merchant.userId]),
    );
    const ownersByMerchantId = await getOwnersByMerchant(
      trialRows.map((merchant) => merchant.id),
      legacyUserIdByMerchantId,
    );

    return NextResponse.json({
      trials: trialRows.map((merchant) => ({
        id: merchant.id,
        businessName: merchant.businessName,
        categoryName: merchant.categoryName,
        city: merchant.city,
        state: merchant.state,
        phone: merchant.phone,
        website: merchant.website,
        requestedAt: merchant.marketLockStatusUpdatedAt.toISOString(),
        updatedAt: merchant.updatedAt.toISOString(),
        createdAt: merchant.createdAt.toISOString(),
        owners: ownersByMerchantId.get(merchant.id) || [],
        publicUrl:
          merchant.isPublicPage &&
          merchant.city &&
          merchant.state &&
          merchant.slug
            ? getMerchantPageUrl(merchant.city, merchant.state, merchant.slug)
            : null,
      })),
      pagination: {
        total: Number(count),
        page,
        limit,
        totalPages: Math.ceil(Number(count) / limit),
      },
      stats: {
        total: Number(count),
      },
    });
  } catch (error) {
    console.error("Error fetching MarketLOCK trial request queue:", error);
    return NextResponse.json(
      { error: "Failed to fetch trial request queue" },
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

    const body = await request.json().catch(() => ({}));
    const merchantId =
      typeof body?.merchantId === "string" ? body.merchantId : "";
    const action = typeof body?.action === "string" ? body.action : "accept";

    if (action !== "accept") {
      return NextResponse.json(
        { error: "Unsupported trial queue action" },
        { status: 400 },
      );
    }

    if (!merchantId) {
      return NextResponse.json(
        { error: "Merchant ID is required" },
        { status: 400 },
      );
    }

    const [merchant] = await db
      .select({
        id: merchants.id,
        marketLockStatus: merchants.marketLockStatus,
      })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 },
      );
    }

    if (merchant.marketLockStatus === "trial") {
      return NextResponse.json({
        success: true,
        merchantId,
        marketLockStatus: "trial",
      });
    }

    if (merchant.marketLockStatus !== "trial_requested") {
      return NextResponse.json(
        { error: "Merchant does not have a pending trial request" },
        { status: 409 },
      );
    }

    const now = new Date();

    await db
      .update(merchants)
      .set({
        marketLockStatus: "trial",
        marketLockStatusUpdatedAt: now,
        updatedAt: now,
      })
      .where(eq(merchants.id, merchantId));

    return NextResponse.json({
      success: true,
      merchantId,
      marketLockStatus: "trial",
      acceptedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Error accepting MarketLOCK trial request:", error);
    return NextResponse.json(
      { error: "Failed to accept trial request" },
      { status: 500 },
    );
  }
}
