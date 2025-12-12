import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { monthlyQualifications, members, grcs, merchants, users } from "@/db/schema";
import { eq, sql, desc, and, or, ilike, gte, isNull, isNotNull } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || "pending"; // pending or sent
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build where conditions - only show qualified members
    const conditions = [
      eq(monthlyQualifications.status, "qualified"),
    ];

    if (status === "pending") {
      conditions.push(isNull(monthlyQualifications.rewardSentAt));
    } else if (status === "sent") {
      conditions.push(isNotNull(monthlyQualifications.rewardSentAt));
    }

    if (month) {
      conditions.push(eq(monthlyQualifications.month, parseInt(month)));
    }

    if (year) {
      conditions.push(eq(monthlyQualifications.year, parseInt(year)));
    }

    if (search) {
      const searchCondition = or(
        ilike(members.firstName, `%${search}%`),
        ilike(members.lastName, `%${search}%`),
        ilike(users.email, `%${search}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Get qualifications with related data
    const qualificationsQuery = db
      .select({
        id: monthlyQualifications.id,
        month: monthlyQualifications.month,
        year: monthlyQualifications.year,
        approvedTotal: monthlyQualifications.approvedTotal,
        status: monthlyQualifications.status,
        rewardSentAt: monthlyQualifications.rewardSentAt,
        giftCardTrackingNumber: monthlyQualifications.giftCardTrackingNumber,
        memberId: members.id,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        memberEmail: users.email,
        memberAddress: members.address,
        memberCity: members.city,
        memberState: members.state,
        memberZip: members.zip,
        grcId: grcs.id,
        grcDenomination: grcs.denomination,
        groceryStore: grcs.groceryStore,
        merchantBusinessName: merchants.businessName,
      })
      .from(monthlyQualifications)
      .innerJoin(members, eq(monthlyQualifications.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .innerJoin(grcs, eq(monthlyQualifications.grcId, grcs.id))
      .innerJoin(merchants, eq(grcs.merchantId, merchants.id))
      .where(and(...conditions))
      .orderBy(desc(monthlyQualifications.year), desc(monthlyQualifications.month))
      .limit(limit)
      .offset(offset);

    const qualificationsList = await qualificationsQuery;

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(monthlyQualifications)
      .innerJoin(members, eq(monthlyQualifications.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .innerJoin(grcs, eq(monthlyQualifications.grcId, grcs.id))
      .innerJoin(merchants, eq(grcs.merchantId, merchants.id))
      .where(and(...conditions));

    const countResult = await countQuery;
    const total = Number(countResult[0]?.count || 0);

    // Get stats
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const [pendingCount, sentThisMonth] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(monthlyQualifications)
        .where(
          and(
            eq(monthlyQualifications.status, "qualified"),
            isNull(monthlyQualifications.rewardSentAt)
          )
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(monthlyQualifications)
        .where(
          and(
            eq(monthlyQualifications.status, "qualified"),
            isNotNull(monthlyQualifications.rewardSentAt),
            gte(monthlyQualifications.rewardSentAt, new Date(currentYear, currentMonth - 1, 1))
          )
        ),
    ]);

    // Calculate total value ($25 per qualification)
    const totalValue = Number(pendingCount[0]?.count || 0) * 25;

    // Transform to expected format
    const formattedQualifications = qualificationsList.map((q) => ({
      id: q.id,
      month: q.month,
      year: q.year,
      approvedTotal: q.approvedTotal,
      status: q.status,
      rewardSentAt: q.rewardSentAt?.toISOString() ?? null,
      giftCardTrackingNumber: q.giftCardTrackingNumber,
      member: {
        id: q.memberId,
        firstName: q.memberFirstName,
        lastName: q.memberLastName,
        email: q.memberEmail,
        address: q.memberAddress,
        city: q.memberCity,
        state: q.memberState,
        zip: q.memberZip,
      },
      grc: {
        id: q.grcId,
        denomination: q.grcDenomination,
        groceryStore: q.groceryStore,
      },
      merchant: {
        businessName: q.merchantBusinessName,
      },
    }));

    return NextResponse.json({
      qualifications: formattedQualifications,
      stats: {
        pending: Number(pendingCount[0]?.count || 0),
        sentThisMonth: Number(sentThisMonth[0]?.count || 0),
        totalValue,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching gift cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch gift cards" },
      { status: 500 }
    );
  }
}
