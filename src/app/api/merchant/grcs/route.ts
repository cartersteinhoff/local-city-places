import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, grcs, members, merchants, grcPurchases } from "@/db";
import { eq, and, sql, desc, or, ilike } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== "merchant" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get merchant ID
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, session.user.id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(grcs.merchantId, merchant.id)];

    if (status !== "all") {
      conditions.push(eq(grcs.status, status as "pending" | "active" | "completed" | "expired"));
    }

    // Get GRCs with member info
    const grcsQuery = db
      .select({
        id: grcs.id,
        denomination: grcs.denomination,
        status: grcs.status,
        monthsRemaining: grcs.monthsRemaining,
        groceryStore: grcs.groceryStore,
        issuedAt: grcs.issuedAt,
        registeredAt: grcs.registeredAt,
        createdAt: grcs.createdAt,
        memberId: grcs.memberId,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        memberEmail: sql<string>`(SELECT email FROM users WHERE id = ${members.userId})`,
      })
      .from(grcs)
      .leftJoin(members, eq(grcs.memberId, members.id))
      .where(and(...conditions))
      .orderBy(desc(grcs.createdAt));

    // Get all results first for filtering
    let allGrcs = await grcsQuery;

    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      allGrcs = allGrcs.filter(
        (g) =>
          g.memberEmail?.toLowerCase().includes(searchLower) ||
          g.memberFirstName?.toLowerCase().includes(searchLower) ||
          g.memberLastName?.toLowerCase().includes(searchLower)
      );
    }

    const total = allGrcs.length;
    const paginatedGrcs = allGrcs.slice(offset, offset + limit);

    // Calculate total months based on denomination
    const getTotalMonths = (denomination: number) => {
      if (denomination <= 75) return 2;
      if (denomination <= 125) return 3;
      if (denomination <= 175) return 4;
      if (denomination <= 250) return 5;
      if (denomination <= 350) return 6;
      if (denomination <= 450) return 8;
      return 10;
    };

    const formattedGrcs = paginatedGrcs.map((g) => {
      const totalMonths = getTotalMonths(g.denomination);
      const monthsCompleted = totalMonths - g.monthsRemaining;

      return {
        id: g.id,
        email: g.memberEmail || null,
        recipientName: g.memberFirstName && g.memberLastName
          ? `${g.memberFirstName} ${g.memberLastName}`
          : null,
        denomination: g.denomination,
        status: g.status,
        monthsCompleted,
        totalMonths,
        groceryStore: g.groceryStore,
        issuedAt: g.issuedAt || g.createdAt,
        registeredAt: g.registeredAt,
      };
    });

    return NextResponse.json({
      grcs: formattedGrcs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Merchant GRCs API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
