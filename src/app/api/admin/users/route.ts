import { NextRequest, NextResponse } from "next/server";
import { db, users, members, merchants, grcPurchases } from "@/db";
import { getSession } from "@/lib/auth";
import { eq, ilike, or, sql, count, desc, and, isNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const pendingTrial = searchParams.get("pendingTrial") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    // If pendingTrial, force role to merchant
    if (pendingTrial) {
      conditions.push(eq(users.role, "merchant"));
    } else if (role && role !== "all") {
      conditions.push(eq(users.role, role as "member" | "merchant" | "admin"));
    }

    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(members.firstName, `%${search}%`),
          ilike(members.lastName, `%${search}%`),
          ilike(merchants.businessName, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0
      ? sql`${conditions.reduce((acc, cond, i) => i === 0 ? cond : sql`${acc} AND ${cond}`)}`
      : undefined;

    // For pendingTrial, we need a subquery to find merchants without trial GRCs
    // Get merchant IDs that have trial GRCs
    const merchantsWithTrialGrcs = db
      .select({ merchantId: grcPurchases.merchantId })
      .from(grcPurchases)
      .where(eq(grcPurchases.isTrial, true));

    // Get total count for pagination
    let baseQuery = db
      .select({ id: users.id, merchantId: merchants.id })
      .from(users)
      .leftJoin(members, eq(users.id, members.userId))
      .leftJoin(merchants, eq(users.id, merchants.userId));

    let allMatchingUsers;
    if (pendingTrial) {
      // For pending trial, we need merchants without trial GRCs
      const merchantsWithTrial = await merchantsWithTrialGrcs;
      const merchantIdsWithTrial = merchantsWithTrial.map(m => m.merchantId);

      allMatchingUsers = await baseQuery.where(
        whereClause
          ? sql`${whereClause} AND ${merchants.id} IS NOT NULL`
          : sql`${merchants.id} IS NOT NULL`
      );

      // Filter out merchants that have trial GRCs
      allMatchingUsers = allMatchingUsers.filter(
        u => u.merchantId && !merchantIdsWithTrial.includes(u.merchantId)
      );
    } else {
      allMatchingUsers = whereClause
        ? await baseQuery.where(whereClause)
        : await baseQuery;
    }

    const total = allMatchingUsers.length;
    const matchingUserIds = allMatchingUsers.slice(offset, offset + limit).map(u => u.id);

    // Fetch users with their profiles (paginated)
    let userList: {
      id: string;
      email: string;
      phone: string | null;
      role: "member" | "merchant" | "admin";
      profilePhotoUrl: string | null;
      createdAt: Date;
      memberFirstName: string | null;
      memberLastName: string | null;
      memberCity: string | null;
      merchantBusinessName: string | null;
      merchantCity: string | null;
      merchantVerified: boolean | null;
      merchantId: string | null;
    }[] = [];
    if (matchingUserIds.length > 0) {
      userList = await db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          role: users.role,
          profilePhotoUrl: users.profilePhotoUrl,
          createdAt: users.createdAt,
          memberFirstName: members.firstName,
          memberLastName: members.lastName,
          memberCity: members.city,
          merchantBusinessName: merchants.businessName,
          merchantCity: merchants.city,
          merchantVerified: merchants.verified,
          merchantId: merchants.id,
        })
        .from(users)
        .leftJoin(members, eq(users.id, members.userId))
        .leftJoin(merchants, eq(users.id, merchants.userId))
        .where(sql`${users.id} IN (${sql.join(matchingUserIds.map(id => sql`${id}`), sql`, `)})`)
        .orderBy(desc(users.createdAt));
    }

    // Get counts by role (always unfiltered for stats)
    const [adminCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "admin"));

    const [merchantCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "merchant"));

    const [memberCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "member"));

    const [totalCount] = await db
      .select({ count: count() })
      .from(users);

    // Get count of merchants pending trial GRC setup
    const merchantsWithTrial = await merchantsWithTrialGrcs;
    const merchantIdsWithTrial = new Set(merchantsWithTrial.map(m => m.merchantId));

    const allMerchants = await db
      .select({ id: merchants.id })
      .from(merchants);

    const pendingTrialCount = allMerchants.filter(m => !merchantIdsWithTrial.has(m.id)).length;

    return NextResponse.json({
      users: userList,
      stats: {
        total: totalCount.count,
        admins: adminCount.count,
        merchants: merchantCount.count,
        members: memberCount.count,
        pendingTrial: pendingTrialCount,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
