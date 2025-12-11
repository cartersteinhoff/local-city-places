import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { grcs, merchants, members, memberGrcQueue } from "@/db/schema";
import { eq, and, isNull, asc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get member profile
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.userId, session.user.id))
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "Member profile not found" }, { status: 404 });
    }

    // Get pending GRCs (status = pending, no memberId assigned yet)
    // These are GRCs that merchants have created but not yet claimed
    // For now, return all pending GRCs since we don't have a recipient email field
    // In production, you'd filter by recipient email or have a different discovery mechanism
    const pendingGrcs = await db
      .select({
        id: grcs.id,
        merchantId: grcs.merchantId,
        denomination: grcs.denomination,
        monthsRemaining: grcs.monthsRemaining,
        status: grcs.status,
        issuedAt: grcs.issuedAt,
        merchantName: merchants.businessName,
      })
      .from(grcs)
      .leftJoin(merchants, eq(grcs.merchantId, merchants.id))
      .where(
        and(
          eq(grcs.status, "pending"),
          isNull(grcs.memberId)
        )
      );

    // Get member's saved GRC order
    const queueOrder = await db
      .select({
        grcId: memberGrcQueue.grcId,
        sortOrder: memberGrcQueue.sortOrder,
      })
      .from(memberGrcQueue)
      .where(eq(memberGrcQueue.memberId, member.id))
      .orderBy(asc(memberGrcQueue.sortOrder));

    // Create a map of grcId -> sortOrder
    const orderMap = new Map(queueOrder.map((q) => [q.grcId, q.sortOrder]));

    // Sort pending GRCs: ordered ones first (by sortOrder), then unordered ones (by issuedAt)
    const sortedPendingGrcs = [...pendingGrcs].sort((a, b) => {
      const orderA = orderMap.get(a.id);
      const orderB = orderMap.get(b.id);

      // Both have order - sort by order
      if (orderA !== undefined && orderB !== undefined) {
        return orderA - orderB;
      }
      // Only a has order - a comes first
      if (orderA !== undefined) return -1;
      // Only b has order - b comes first
      if (orderB !== undefined) return 1;
      // Neither has order - sort by issuedAt (newest first)
      const dateA = a.issuedAt ? new Date(a.issuedAt).getTime() : 0;
      const dateB = b.issuedAt ? new Date(b.issuedAt).getTime() : 0;
      return dateB - dateA;
    });

    // Get active GRCs (claimed by this member with status = active)
    const activeGrcs = await db
      .select({
        id: grcs.id,
        merchantId: grcs.merchantId,
        denomination: grcs.denomination,
        monthsRemaining: grcs.monthsRemaining,
        status: grcs.status,
        groceryStore: grcs.groceryStore,
        startMonth: grcs.startMonth,
        startYear: grcs.startYear,
        registeredAt: grcs.registeredAt,
        merchantName: merchants.businessName,
      })
      .from(grcs)
      .leftJoin(merchants, eq(grcs.merchantId, merchants.id))
      .where(
        and(
          eq(grcs.memberId, member.id),
          eq(grcs.status, "active")
        )
      );

    // Check if member has an active GRC (can only have one at a time)
    const hasActiveGrc = activeGrcs.length > 0;

    return NextResponse.json({
      hasActiveGrc,
      pending: sortedPendingGrcs.map((grc) => ({
        id: grc.id,
        merchantName: grc.merchantName,
        denomination: grc.denomination,
        monthsRemaining: grc.monthsRemaining,
        totalRebates: grc.monthsRemaining * 25,
        issuedAt: grc.issuedAt,
      })),
      active: activeGrcs.map((grc) => ({
        id: grc.id,
        merchantName: grc.merchantName,
        denomination: grc.denomination,
        monthsRemaining: grc.monthsRemaining,
        groceryStore: grc.groceryStore,
        startMonth: grc.startMonth,
        startYear: grc.startYear,
        registeredAt: grc.registeredAt,
        status: grc.status,
      })),
    });
  } catch (error) {
    console.error("Error fetching member GRCs:", error);
    return NextResponse.json(
      { error: "Failed to fetch GRCs" },
      { status: 500 }
    );
  }
}
