import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { receipts, members, grcs, merchants, users } from "@/db/schema";
import { eq, sql, desc, and, or, ilike, gte } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const flagsOnly = searchParams.get("flagsOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (status && status !== "all") {
      conditions.push(eq(receipts.status, status as "pending" | "approved" | "rejected"));
    }

    if (flagsOnly) {
      const flagsCondition = or(
        eq(receipts.storeMismatch, true),
        eq(receipts.dateMismatch, true),
        eq(receipts.memberOverride, true)
      );
      if (flagsCondition) {
        conditions.push(flagsCondition);
      }
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

    // Get receipts with related data
    const receiptsQuery = db
      .select({
        id: receipts.id,
        imageUrl: receipts.imageUrl,
        amount: receipts.amount,
        receiptDate: receipts.receiptDate,
        extractedStoreName: receipts.extractedStoreName,
        storeMismatch: receipts.storeMismatch,
        dateMismatch: receipts.dateMismatch,
        memberOverride: receipts.memberOverride,
        status: receipts.status,
        rejectionReason: receipts.rejectionReason,
        rejectionNotes: receipts.rejectionNotes,
        submittedAt: receipts.submittedAt,
        reviewedAt: receipts.reviewedAt,
        memberId: members.id,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        memberEmail: users.email,
        grcId: grcs.id,
        grcDenomination: grcs.denomination,
        groceryStore: grcs.groceryStore,
        groceryStorePlaceId: grcs.groceryStorePlaceId,
        merchantBusinessName: merchants.businessName,
      })
      .from(receipts)
      .innerJoin(members, eq(receipts.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .innerJoin(grcs, eq(receipts.grcId, grcs.id))
      .innerJoin(merchants, eq(grcs.merchantId, merchants.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(receipts.submittedAt))
      .limit(limit)
      .offset(offset);

    const receiptsList = await receiptsQuery;

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(receipts)
      .innerJoin(members, eq(receipts.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .innerJoin(grcs, eq(receipts.grcId, grcs.id))
      .innerJoin(merchants, eq(grcs.merchantId, merchants.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const countResult = await countQuery;
    const total = Number(countResult[0]?.count || 0);

    // Get stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [pendingCount, approvedThisMonth, rejectedCount] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(receipts)
        .where(eq(receipts.status, "pending")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(receipts)
        .where(
          and(
            eq(receipts.status, "approved"),
            gte(receipts.reviewedAt, startOfMonth)
          )
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(receipts)
        .where(eq(receipts.status, "rejected")),
    ]);

    // Transform receipts to expected format
    const formattedReceipts = receiptsList.map((r) => ({
      id: r.id,
      imageUrl: r.imageUrl,
      amount: r.amount,
      receiptDate: r.receiptDate?.toISOString() ?? null,
      extractedStoreName: r.extractedStoreName,
      storeMismatch: r.storeMismatch,
      dateMismatch: r.dateMismatch,
      memberOverride: r.memberOverride,
      status: r.status,
      rejectionReason: r.rejectionReason,
      rejectionNotes: r.rejectionNotes,
      submittedAt: r.submittedAt.toISOString(),
      reviewedAt: r.reviewedAt?.toISOString() ?? null,
      member: {
        id: r.memberId,
        firstName: r.memberFirstName,
        lastName: r.memberLastName,
        email: r.memberEmail,
      },
      grc: {
        id: r.grcId,
        denomination: r.grcDenomination,
        groceryStore: r.groceryStore,
        groceryStorePlaceId: r.groceryStorePlaceId,
      },
      merchant: {
        businessName: r.merchantBusinessName,
      },
    }));

    return NextResponse.json({
      receipts: formattedReceipts,
      stats: {
        pending: Number(pendingCount[0]?.count || 0),
        approvedThisMonth: Number(approvedThisMonth[0]?.count || 0),
        rejected: Number(rejectedCount[0]?.count || 0),
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipts" },
      { status: 500 }
    );
  }
}
