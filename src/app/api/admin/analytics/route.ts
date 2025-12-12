import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, grcs, receipts, monthlyQualifications, merchants } from "@/db/schema";
import { eq, sql, desc, gte, and, isNotNull } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "30d";

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let prevStartDate: Date;
    let prevEndDate: Date;

    switch (range) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        prevEndDate = new Date(startDate.getTime() - 1);
        prevStartDate = new Date(prevEndDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        prevEndDate = new Date(startDate.getTime() - 1);
        prevStartDate = new Date(prevEndDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "ytd":
        startDate = new Date(now.getFullYear(), 0, 1);
        prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
        prevEndDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case "all":
        startDate = new Date(2020, 0, 1);
        prevStartDate = new Date(2019, 0, 1);
        prevEndDate = new Date(2019, 11, 31);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        prevEndDate = new Date(startDate.getTime() - 1);
        prevStartDate = new Date(prevEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get current period stats
    const [
      totalUsersResult,
      currentUsersResult,
      prevUsersResult,
      activeGrcsResult,
      prevActiveGrcsResult,
      totalReceiptsResult,
      currentReceiptsResult,
      prevReceiptsResult,
      giftCardsSentResult,
      prevGiftCardsSentResult,
    ] = await Promise.all([
      // Total users (all time)
      db.select({ count: sql<number>`count(*)` }).from(users),
      // Users created in current period
      db.select({ count: sql<number>`count(*)` }).from(users).where(gte(users.createdAt, startDate)),
      // Users created in previous period
      db.select({ count: sql<number>`count(*)` }).from(users).where(and(gte(users.createdAt, prevStartDate), sql`${users.createdAt} < ${startDate}`)),
      // Active GRCs
      db.select({ count: sql<number>`count(*)` }).from(grcs).where(eq(grcs.status, "active")),
      // Previous period active (estimate using registrations)
      db.select({ count: sql<number>`count(*)` }).from(grcs).where(and(eq(grcs.status, "active"), sql`${grcs.registeredAt} < ${startDate}`)),
      // Total receipts
      db.select({ count: sql<number>`count(*)` }).from(receipts),
      // Current period receipts
      db.select({ count: sql<number>`count(*)` }).from(receipts).where(gte(receipts.submittedAt, startDate)),
      // Previous period receipts
      db.select({ count: sql<number>`count(*)` }).from(receipts).where(and(gte(receipts.submittedAt, prevStartDate), sql`${receipts.submittedAt} < ${startDate}`)),
      // Gift cards sent (all time qualified with reward sent)
      db.select({ count: sql<number>`count(*)` }).from(monthlyQualifications).where(isNotNull(monthlyQualifications.rewardSentAt)),
      // Previous period gift cards
      db.select({ count: sql<number>`count(*)` }).from(monthlyQualifications).where(and(isNotNull(monthlyQualifications.rewardSentAt), sql`${monthlyQualifications.rewardSentAt} < ${startDate}`)),
    ]);

    // Calculate percentage changes
    const calcChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const totalUsers = Number(totalUsersResult[0]?.count || 0);
    const currentUsers = Number(currentUsersResult[0]?.count || 0);
    const prevUsers = Number(prevUsersResult[0]?.count || 0);

    const activeGrcs = Number(activeGrcsResult[0]?.count || 0);
    const prevActiveGrcs = Number(prevActiveGrcsResult[0]?.count || 0);

    const totalReceipts = Number(totalReceiptsResult[0]?.count || 0);
    const currentReceipts = Number(currentReceiptsResult[0]?.count || 0);
    const prevReceipts = Number(prevReceiptsResult[0]?.count || 0);

    const giftCardsSent = Number(giftCardsSentResult[0]?.count || 0);
    const prevGiftCardsSent = Number(prevGiftCardsSentResult[0]?.count || 0);
    const currentGiftCards = giftCardsSent - prevGiftCardsSent;
    const prevPeriodGiftCards = prevGiftCardsSent;

    // Users by role
    const usersByRoleResult = await db
      .select({
        role: users.role,
        count: sql<number>`count(*)`,
      })
      .from(users)
      .groupBy(users.role);

    const usersByRole = {
      members: 0,
      merchants: 0,
      admins: 0,
    };
    for (const row of usersByRoleResult) {
      if (row.role === "member") usersByRole.members = Number(row.count);
      if (row.role === "merchant") usersByRole.merchants = Number(row.count);
      if (row.role === "admin") usersByRole.admins = Number(row.count);
    }

    // GRCs by status
    const grcsByStatusResult = await db
      .select({
        status: grcs.status,
        count: sql<number>`count(*)`,
      })
      .from(grcs)
      .groupBy(grcs.status);

    const grcsByStatus = {
      pending: 0,
      active: 0,
      completed: 0,
      expired: 0,
    };
    for (const row of grcsByStatusResult) {
      if (row.status in grcsByStatus) {
        grcsByStatus[row.status as keyof typeof grcsByStatus] = Number(row.count);
      }
    }

    // Receipts by status
    const receiptsByStatusResult = await db
      .select({
        status: receipts.status,
        count: sql<number>`count(*)`,
      })
      .from(receipts)
      .groupBy(receipts.status);

    const receiptsByStatus = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    for (const row of receiptsByStatusResult) {
      if (row.status in receiptsByStatus) {
        receiptsByStatus[row.status as keyof typeof receiptsByStatus] = Number(row.count);
      }
    }

    // Top merchants by active GRCs
    const topMerchantsResult = await db
      .select({
        id: merchants.id,
        name: merchants.businessName,
        activeGrcs: sql<number>`count(${grcs.id})`,
      })
      .from(merchants)
      .leftJoin(grcs, and(eq(grcs.merchantId, merchants.id), eq(grcs.status, "active")))
      .groupBy(merchants.id)
      .orderBy(desc(sql`count(${grcs.id})`))
      .limit(5);

    // Top grocery stores by receipt count
    const topGroceryStoresResult = await db
      .select({
        name: grcs.groceryStore,
        receiptCount: sql<number>`count(${receipts.id})`,
      })
      .from(receipts)
      .innerJoin(grcs, eq(receipts.grcId, grcs.id))
      .where(isNotNull(grcs.groceryStore))
      .groupBy(grcs.groceryStore)
      .orderBy(desc(sql`count(${receipts.id})`))
      .limit(5);

    return NextResponse.json({
      summary: {
        totalUsers: {
          value: totalUsers,
          change: calcChange(currentUsers, prevUsers),
        },
        activeGrcs: {
          value: activeGrcs,
          change: calcChange(activeGrcs, prevActiveGrcs),
        },
        totalReceipts: {
          value: totalReceipts,
          change: calcChange(currentReceipts, prevReceipts),
        },
        giftCardsSent: {
          value: giftCardsSent,
          change: calcChange(currentGiftCards, prevPeriodGiftCards),
        },
      },
      usersByRole,
      grcsByStatus,
      receiptsByStatus,
      topMerchants: topMerchantsResult.map((m) => ({
        id: m.id,
        name: m.name,
        activeGrcs: Number(m.activeGrcs),
      })),
      topGroceryStores: topGroceryStoresResult
        .filter((s) => s.name)
        .map((s) => ({
          name: s.name as string,
          receiptCount: Number(s.receiptCount),
        })),
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
