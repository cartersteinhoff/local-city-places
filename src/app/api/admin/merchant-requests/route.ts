import { and, asc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db, merchantRequests } from "@/db";
import { getSession } from "@/lib/auth";

const statuses = ["new", "fulfilled"] as const;

function serializeRequest(request: typeof merchantRequests.$inferSelect) {
  return {
    ...request,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    inviteSentAt: request.inviteSentAt?.toISOString() || null,
    fulfilledAt: request.fulfilledAt?.toISOString() || null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
    );
    const offset = (page - 1) * limit;
    const requestedStatus = searchParams.get("status") || "new";
    const status =
      requestedStatus === "all" ||
      statuses.includes(requestedStatus as (typeof statuses)[number])
        ? requestedStatus
        : "new";
    const search = searchParams.get("search")?.trim() || "";

    const conditions: SQL[] = [];

    if (
      status !== "all" &&
      statuses.includes(status as (typeof statuses)[number])
    ) {
      conditions.push(
        eq(merchantRequests.status, status as (typeof statuses)[number]),
      );
    }

    if (search) {
      const phoneSearch = search.replace(/\D/g, "");
      const searchConditions: SQL[] = [
        ilike(merchantRequests.businessName, `%${search}%`),
        ilike(merchantRequests.ownerName, `%${search}%`),
        ilike(merchantRequests.email, `%${search}%`),
        ilike(merchantRequests.city, `%${search}%`),
        ilike(merchantRequests.requestedCategory, `%${search}%`),
      ];

      if (phoneSearch) {
        searchConditions.push(
          ilike(merchantRequests.mobilePhone, `%${phoneSearch}%`),
        );
      }

      const searchClause = or(...searchConditions);

      if (searchClause) {
        conditions.push(searchClause);
      }
    }

    const whereClause =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : and(...conditions);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(merchantRequests)
      .where(whereClause);

    const requestList = await db
      .select()
      .from(merchantRequests)
      .where(whereClause)
      .orderBy(asc(merchantRequests.createdAt))
      .limit(limit)
      .offset(offset);

    const statsEntries = await Promise.all(
      statuses.map(async (requestStatus) => {
        const [{ count: statusCount }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(merchantRequests)
          .where(eq(merchantRequests.status, requestStatus));

        return [requestStatus, Number(statusCount)] as const;
      }),
    );

    const total = Number(count);

    return NextResponse.json({
      requests: requestList.map(serializeRequest),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        ...Object.fromEntries(statsEntries),
        total: statsEntries.reduce((sum, [, value]) => sum + value, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching merchant requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchant requests" },
      { status: 500 },
    );
  }
}
