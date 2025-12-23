import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, grcs, receipts, monthlyQualifications, merchants, grcPurchases, members } from "@/db/schema";
import { eq, sql, desc, gte, and, isNotNull, lt, isNull, ne } from "drizzle-orm";
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
      db.select({ count: sql<number>`count(*)` }).from(users).where(and(gte(users.createdAt, prevStartDate), lt(users.createdAt, startDate))),
      // Active GRCs
      db.select({ count: sql<number>`count(*)` }).from(grcs).where(eq(grcs.status, "active")),
      // Previous period active (estimate using registrations)
      db.select({ count: sql<number>`count(*)` }).from(grcs).where(and(eq(grcs.status, "active"), lt(grcs.registeredAt, startDate))),
      // Total receipts
      db.select({ count: sql<number>`count(*)` }).from(receipts),
      // Current period receipts
      db.select({ count: sql<number>`count(*)` }).from(receipts).where(gte(receipts.submittedAt, startDate)),
      // Previous period receipts
      db.select({ count: sql<number>`count(*)` }).from(receipts).where(and(gte(receipts.submittedAt, prevStartDate), lt(receipts.submittedAt, startDate))),
      // Gift cards sent (all time qualified with reward sent)
      db.select({ count: sql<number>`count(*)` }).from(monthlyQualifications).where(isNotNull(monthlyQualifications.rewardSentAt)),
      // Previous period gift cards
      db.select({ count: sql<number>`count(*)` }).from(monthlyQualifications).where(and(isNotNull(monthlyQualifications.rewardSentAt), lt(monthlyQualifications.rewardSentAt, startDate))),
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

    // ============================================
    // PHASE 1: Quick Wins
    // ============================================

    // 1. Revenue Summary (from grcPurchases)
    const [
      totalRevenueResult,
      pendingRevenueResult,
      revenueByDenominationResult,
      revenueByPaymentMethodResult,
    ] = await Promise.all([
      // Total confirmed revenue
      db.select({
        total: sql<string>`COALESCE(SUM(${grcPurchases.totalCost}), 0)`
      }).from(grcPurchases).where(eq(grcPurchases.paymentStatus, "confirmed")),

      // Pending revenue
      db.select({
        total: sql<string>`COALESCE(SUM(${grcPurchases.totalCost}), 0)`
      }).from(grcPurchases).where(eq(grcPurchases.paymentStatus, "pending")),

      // Revenue by denomination
      db.select({
        denomination: grcPurchases.denomination,
        total: sql<string>`COALESCE(SUM(${grcPurchases.totalCost}), 0)`,
        count: sql<number>`count(*)`,
      }).from(grcPurchases)
        .where(eq(grcPurchases.paymentStatus, "confirmed"))
        .groupBy(grcPurchases.denomination)
        .orderBy(grcPurchases.denomination),

      // Revenue by payment method
      db.select({
        method: grcPurchases.paymentMethod,
        total: sql<string>`COALESCE(SUM(${grcPurchases.totalCost}), 0)`,
        count: sql<number>`count(*)`,
      }).from(grcPurchases)
        .where(eq(grcPurchases.paymentStatus, "confirmed"))
        .groupBy(grcPurchases.paymentMethod),
    ]);

    // Trial conversion - separate simpler query
    const trialMerchantIds = await db
      .selectDistinct({ merchantId: grcPurchases.merchantId })
      .from(grcPurchases)
      .where(eq(grcPurchases.isTrial, true));

    const trialMerchantIdSet = new Set(trialMerchantIds.map(t => t.merchantId));

    const paidPurchases = await db
      .selectDistinct({ merchantId: grcPurchases.merchantId })
      .from(grcPurchases)
      .where(and(
        eq(grcPurchases.isTrial, false),
        eq(grcPurchases.paymentStatus, "confirmed")
      ));

    const convertedCount = paidPurchases.filter(p => trialMerchantIdSet.has(p.merchantId)).length;
    const trialConversionResult = [{
      trialMerchants: trialMerchantIdSet.size,
      convertedMerchants: convertedCount,
    }];

    // 2. Qualification Funnel
    const [
      activeGrcsForFunnel,
      grcsWithReceipts,
      qualifiedCount,
      rewardsSentCount,
    ] = await Promise.all([
      // Active GRCs (starting point)
      db.select({ count: sql<number>`count(*)` }).from(grcs).where(eq(grcs.status, "active")),

      // GRCs with at least one approved receipt this month
      db.select({ count: sql<number>`count(DISTINCT ${grcs.id})` })
        .from(grcs)
        .innerJoin(receipts, eq(receipts.grcId, grcs.id))
        .where(and(
          eq(grcs.status, "active"),
          eq(receipts.status, "approved")
        )),

      // Monthly qualifications that reached qualified status
      db.select({ count: sql<number>`count(*)` })
        .from(monthlyQualifications)
        .where(eq(monthlyQualifications.status, "qualified")),

      // Rewards actually sent
      db.select({ count: sql<number>`count(*)` })
        .from(monthlyQualifications)
        .where(isNotNull(monthlyQualifications.rewardSentAt)),
    ]);

    // 3. Receipt Rejection Breakdown
    const rejectionReasonsResult = await db
      .select({
        reason: receipts.rejectionReason,
        count: sql<number>`count(*)`,
      })
      .from(receipts)
      .where(and(
        eq(receipts.status, "rejected"),
        isNotNull(receipts.rejectionReason)
      ))
      .groupBy(receipts.rejectionReason)
      .orderBy(desc(sql`count(*)`));

    // Receipt flags breakdown
    const [storeMismatchCount, dateMismatchCount, memberOverrideCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(receipts).where(eq(receipts.storeMismatch, true)),
      db.select({ count: sql<number>`count(*)` }).from(receipts).where(eq(receipts.dateMismatch, true)),
      db.select({ count: sql<number>`count(*)` }).from(receipts).where(eq(receipts.memberOverride, true)),
    ]);

    // 4. Pending Actions Counter
    const [
      pendingReceiptsCount,
      pendingPaymentsCount,
      pendingRewardsCount,
      unverifiedMerchantsCount,
      flaggedReceiptsCount,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(receipts).where(eq(receipts.status, "pending")),
      db.select({ count: sql<number>`count(*)` }).from(grcPurchases).where(eq(grcPurchases.paymentStatus, "pending")),
      db.select({ count: sql<number>`count(*)` }).from(monthlyQualifications).where(eq(monthlyQualifications.status, "qualified")),
      db.select({ count: sql<number>`count(*)` }).from(merchants).where(eq(merchants.verified, false)),
      db.select({ count: sql<number>`count(*)` }).from(receipts).where(and(
        eq(receipts.memberOverride, true),
        eq(receipts.status, "pending")
      )),
    ]);

    // 5. Member Engagement Tiers
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalMembersResult,
      activeMembersResult,
      atRiskMembersResult,
      newMembersResult,
    ] = await Promise.all([
      // Total members with active GRCs
      db.select({ count: sql<number>`count(DISTINCT ${grcs.memberId})` })
        .from(grcs)
        .where(eq(grcs.status, "active")),

      // Active: uploaded receipt in last 30 days
      db.select({ count: sql<number>`count(DISTINCT ${receipts.memberId})` })
        .from(receipts)
        .where(gte(receipts.submittedAt, thirtyDaysAgo)),

      // At risk: has active GRC but no receipt in 14-30 days
      db.select({ count: sql<number>`count(DISTINCT ${grcs.memberId})` })
        .from(grcs)
        .leftJoin(receipts, and(
          eq(receipts.memberId, grcs.memberId),
          gte(receipts.submittedAt, fourteenDaysAgo)
        ))
        .where(and(
          eq(grcs.status, "active"),
          isNull(receipts.id)
        )),

      // New members this period
      db.select({ count: sql<number>`count(*)` })
        .from(members)
        .where(gte(members.createdAt, startDate)),
    ]);

    // ============================================
    // PHASE 2: Visualizations
    // ============================================

    // 6. Time Series Data (last 12 weeks of receipts and revenue)
    const twelveWeeksAgo = new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000);

    const [weeklyReceiptsResult, weeklyRevenueResult, weeklySignupsResult] = await Promise.all([
      // Weekly receipt submissions
      db.select({
        week: sql<string>`TO_CHAR(DATE_TRUNC('week', ${receipts.submittedAt}), 'YYYY-MM-DD')`,
        total: sql<number>`count(*)`,
        approved: sql<number>`count(*) FILTER (WHERE ${receipts.status} = 'approved')`,
        rejected: sql<number>`count(*) FILTER (WHERE ${receipts.status} = 'rejected')`,
      })
        .from(receipts)
        .where(gte(receipts.submittedAt, twelveWeeksAgo))
        .groupBy(sql`DATE_TRUNC('week', ${receipts.submittedAt})`)
        .orderBy(sql`DATE_TRUNC('week', ${receipts.submittedAt})`),

      // Weekly revenue (confirmed payments)
      db.select({
        week: sql<string>`TO_CHAR(DATE_TRUNC('week', ${grcPurchases.paymentConfirmedAt}), 'YYYY-MM-DD')`,
        total: sql<string>`COALESCE(SUM(${grcPurchases.totalCost}), 0)`,
        count: sql<number>`count(*)`,
      })
        .from(grcPurchases)
        .where(and(
          eq(grcPurchases.paymentStatus, "confirmed"),
          isNotNull(grcPurchases.paymentConfirmedAt),
          gte(grcPurchases.paymentConfirmedAt, twelveWeeksAgo)
        ))
        .groupBy(sql`DATE_TRUNC('week', ${grcPurchases.paymentConfirmedAt})`)
        .orderBy(sql`DATE_TRUNC('week', ${grcPurchases.paymentConfirmedAt})`),

      // Weekly user signups
      db.select({
        week: sql<string>`TO_CHAR(DATE_TRUNC('week', ${users.createdAt}), 'YYYY-MM-DD')`,
        total: sql<number>`count(*)`,
        members: sql<number>`count(*) FILTER (WHERE ${users.role} = 'member')`,
        merchants: sql<number>`count(*) FILTER (WHERE ${users.role} = 'merchant')`,
      })
        .from(users)
        .where(gte(users.createdAt, twelveWeeksAgo))
        .groupBy(sql`DATE_TRUNC('week', ${users.createdAt})`)
        .orderBy(sql`DATE_TRUNC('week', ${users.createdAt})`),
    ]);

    // 7. Geographic Breakdown
    const [membersByStateResult, merchantsByStateResult] = await Promise.all([
      db.select({
        state: members.state,
        count: sql<number>`count(*)`,
      })
        .from(members)
        .where(isNotNull(members.state))
        .groupBy(members.state)
        .orderBy(desc(sql`count(*)`))
        .limit(10),

      db.select({
        state: merchants.state,
        count: sql<number>`count(*)`,
      })
        .from(merchants)
        .where(isNotNull(merchants.state))
        .groupBy(merchants.state)
        .orderBy(desc(sql`count(*)`))
        .limit(10),
    ]);

    // 8. Merchant Health Metrics
    const [
      verifiedMerchantsResult,
      merchantInventoryResult,
      inactiveMerchantsResult,
    ] = await Promise.all([
      // Verified vs unverified
      db.select({
        verified: merchants.verified,
        count: sql<number>`count(*)`,
      })
        .from(merchants)
        .groupBy(merchants.verified),

      // Merchant inventory levels (purchased - issued)
      db.select({
        merchantId: merchants.id,
        businessName: merchants.businessName,
        purchased: sql<number>`COALESCE((
          SELECT SUM(quantity) FROM grc_purchases
          WHERE merchant_id = ${merchants.id} AND payment_status = 'confirmed'
        ), 0)`,
        issued: sql<number>`COALESCE((
          SELECT COUNT(*) FROM grcs WHERE merchant_id = ${merchants.id}
        ), 0)`,
      })
        .from(merchants)
        .where(eq(merchants.verified, true))
        .limit(20),

      // Merchants who purchased but never issued
      db.select({
        count: sql<number>`count(*)`,
      })
        .from(merchants)
        .where(and(
          eq(merchants.verified, true),
          sql`${merchants.id} IN (SELECT merchant_id FROM grc_purchases WHERE payment_status = 'confirmed')`,
          sql`${merchants.id} NOT IN (SELECT merchant_id FROM grcs)`
        )),
    ]);

    // Process merchant inventory into tiers
    const inventoryTiers = { zero: 0, low: 0, healthy: 0 };
    for (const m of merchantInventoryResult) {
      const available = Number(m.purchased) - Number(m.issued);
      if (available <= 0) inventoryTiers.zero++;
      else if (available <= 3) inventoryTiers.low++;
      else inventoryTiers.healthy++;
    }

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

      // Phase 1: Quick Wins
      revenue: {
        total: parseFloat(totalRevenueResult[0]?.total || "0"),
        pending: parseFloat(pendingRevenueResult[0]?.total || "0"),
        byDenomination: revenueByDenominationResult.map((r) => ({
          denomination: r.denomination,
          total: parseFloat(r.total || "0"),
          count: Number(r.count),
        })),
        byPaymentMethod: revenueByPaymentMethodResult.map((r) => ({
          method: r.method,
          total: parseFloat(r.total || "0"),
          count: Number(r.count),
        })),
        trialConversion: {
          trialMerchants: Number(trialConversionResult[0]?.trialMerchants || 0),
          convertedMerchants: Number(trialConversionResult[0]?.convertedMerchants || 0),
        },
      },

      qualificationFunnel: {
        activeGrcs: Number(activeGrcsForFunnel[0]?.count || 0),
        withReceipts: Number(grcsWithReceipts[0]?.count || 0),
        qualified: Number(qualifiedCount[0]?.count || 0),
        rewardsSent: Number(rewardsSentCount[0]?.count || 0),
      },

      rejectionBreakdown: {
        reasons: rejectionReasonsResult.map((r) => ({
          reason: r.reason || "Unknown",
          count: Number(r.count),
        })),
        flags: {
          storeMismatch: Number(storeMismatchCount[0]?.count || 0),
          dateMismatch: Number(dateMismatchCount[0]?.count || 0),
          memberOverride: Number(memberOverrideCount[0]?.count || 0),
        },
      },

      pendingActions: {
        receipts: Number(pendingReceiptsCount[0]?.count || 0),
        payments: Number(pendingPaymentsCount[0]?.count || 0),
        rewards: Number(pendingRewardsCount[0]?.count || 0),
        unverifiedMerchants: Number(unverifiedMerchantsCount[0]?.count || 0),
        flaggedReceipts: Number(flaggedReceiptsCount[0]?.count || 0),
      },

      memberEngagement: {
        totalWithActiveGrc: Number(totalMembersResult[0]?.count || 0),
        active: Number(activeMembersResult[0]?.count || 0),
        atRisk: Number(atRiskMembersResult[0]?.count || 0),
        newThisPeriod: Number(newMembersResult[0]?.count || 0),
      },

      // Phase 2: Visualizations
      timeSeries: {
        receipts: weeklyReceiptsResult.map((r) => ({
          week: r.week,
          total: Number(r.total),
          approved: Number(r.approved),
          rejected: Number(r.rejected),
        })),
        revenue: weeklyRevenueResult.map((r) => ({
          week: r.week,
          total: parseFloat(r.total || "0"),
          count: Number(r.count),
        })),
        signups: weeklySignupsResult.map((r) => ({
          week: r.week,
          total: Number(r.total),
          members: Number(r.members),
          merchants: Number(r.merchants),
        })),
      },

      geographic: {
        membersByState: membersByStateResult.map((r) => ({
          state: r.state || "Unknown",
          count: Number(r.count),
        })),
        merchantsByState: merchantsByStateResult.map((r) => ({
          state: r.state || "Unknown",
          count: Number(r.count),
        })),
      },

      merchantHealth: {
        verified: Number(verifiedMerchantsResult.find((r) => r.verified)?.count || 0),
        unverified: Number(verifiedMerchantsResult.find((r) => !r.verified)?.count || 0),
        inventoryTiers,
        inactiveMerchants: Number(inactiveMerchantsResult[0]?.count || 0),
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { error: "Failed to fetch analytics", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
