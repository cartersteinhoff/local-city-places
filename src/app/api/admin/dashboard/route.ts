import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, members, merchants, grcs, receipts, monthlyQualifications } from "@/db/schema";
import { eq, sql, desc, and, isNotNull } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Pending receipts count
    const pendingReceiptsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(receipts)
      .where(eq(receipts.status, "pending"));
    const pendingReceipts = Number(pendingReceiptsResult[0]?.count || 0);

    // Gift cards pending (qualified but not sent)
    const giftCardsPendingResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(monthlyQualifications)
      .where(
        and(
          eq(monthlyQualifications.status, "qualified"),
          sql`${monthlyQualifications.rewardSentAt} IS NULL`
        )
      );
    const giftCardsPending = Number(giftCardsPendingResult[0]?.count || 0);

    // Active members (members with active GRCs)
    const activeMembersResult = await db
      .select({ count: sql<number>`count(distinct ${members.id})` })
      .from(members)
      .innerJoin(grcs, eq(grcs.memberId, members.id))
      .where(eq(grcs.status, "active"));
    const activeMembers = Number(activeMembersResult[0]?.count || 0);

    // Active merchants (verified merchants)
    const activeMerchantsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(merchants)
      .where(eq(merchants.verified, true));
    const activeMerchants = Number(activeMerchantsResult[0]?.count || 0);

    // Recent activity - combine different types
    const recentActivity: Array<{
      type: string;
      memberName?: string;
      merchantName?: string;
      adminName?: string;
      amount?: string;
      timestamp: string;
    }> = [];

    // Recent receipt submissions
    const recentReceipts = await db
      .select({
        id: receipts.id,
        submittedAt: receipts.submittedAt,
        memberFirstName: users.firstName,
        memberLastName: users.lastName,
        amount: receipts.amount,
      })
      .from(receipts)
      .innerJoin(members, eq(receipts.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .orderBy(desc(receipts.submittedAt))
      .limit(5);

    for (const r of recentReceipts) {
      recentActivity.push({
        type: "receipt_submitted",
        memberName: `${r.memberFirstName} ${r.memberLastName}`,
        amount: r.amount ?? undefined,
        timestamp: r.submittedAt.toISOString(),
      });
    }

    // Recent GRC registrations
    const recentRegistrations = await db
      .select({
        id: grcs.id,
        registeredAt: grcs.registeredAt,
        memberFirstName: users.firstName,
        memberLastName: users.lastName,
        merchantBusinessName: merchants.businessName,
      })
      .from(grcs)
      .innerJoin(members, eq(grcs.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .innerJoin(merchants, eq(grcs.merchantId, merchants.id))
      .where(isNotNull(grcs.registeredAt))
      .orderBy(desc(grcs.registeredAt))
      .limit(5);

    for (const r of recentRegistrations) {
      if (r.registeredAt) {
        recentActivity.push({
          type: "grc_registered",
          memberName: `${r.memberFirstName} ${r.memberLastName}`,
          merchantName: r.merchantBusinessName,
          timestamp: r.registeredAt.toISOString(),
        });
      }
    }

    // Recent receipt approvals
    const recentApprovals = await db
      .select({
        id: receipts.id,
        reviewedAt: receipts.reviewedAt,
        memberFirstName: sql<string>`member_user.first_name`,
        memberLastName: sql<string>`member_user.last_name`,
        adminFirstName: sql<string>`admin_user.first_name`,
        adminLastName: sql<string>`admin_user.last_name`,
      })
      .from(receipts)
      .innerJoin(members, eq(receipts.memberId, members.id))
      .innerJoin(
        sql`users as member_user`,
        sql`member_user.id = ${members.userId}`
      )
      .leftJoin(
        sql`users as admin_user`,
        sql`admin_user.id = ${receipts.reviewedBy}`
      )
      .where(and(eq(receipts.status, "approved"), isNotNull(receipts.reviewedAt)))
      .orderBy(desc(receipts.reviewedAt))
      .limit(5);

    for (const r of recentApprovals) {
      if (r.reviewedAt) {
        recentActivity.push({
          type: "receipt_approved",
          memberName: `${r.memberFirstName} ${r.memberLastName}`,
          adminName: r.adminFirstName && r.adminLastName
            ? `${r.adminFirstName} ${r.adminLastName}`
            : "Admin",
          timestamp: r.reviewedAt.toISOString(),
        });
      }
    }

    // Sort by timestamp and take top 10
    recentActivity.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      stats: {
        pendingReceipts,
        giftCardsPending,
        activeMembers,
        activeMerchants,
      },
      recentActivity: recentActivity.slice(0, 10),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
