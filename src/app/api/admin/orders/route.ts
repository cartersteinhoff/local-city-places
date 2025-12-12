import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { grcPurchases, merchants, merchantBankAccounts, users } from "@/db/schema";
import { eq, desc, sql, and, or, ilike } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status"); // pending, confirmed, failed, or null for all
    const search = searchParams.get("search")?.trim();

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    if (status && ["pending", "confirmed", "failed"].includes(status)) {
      conditions.push(eq(grcPurchases.paymentStatus, status as "pending" | "confirmed" | "failed"));
    }
    if (search) {
      conditions.push(
        or(
          ilike(merchants.businessName, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(grcPurchases.zelleAccountName, `%${search}%`),
          ilike(merchantBankAccounts.accountHolderName, `%${search}%`),
          ilike(merchantBankAccounts.bankName, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(grcPurchases)
      .leftJoin(merchants, eq(grcPurchases.merchantId, merchants.id))
      .leftJoin(users, eq(merchants.userId, users.id))
      .leftJoin(merchantBankAccounts, eq(merchants.id, merchantBankAccounts.merchantId))
      .where(whereClause);

    const total = Number(countResult?.count) || 0;
    const totalPages = Math.ceil(total / limit);

    // Get paginated orders with merchant info
    const orders = await db
      .select({
        id: grcPurchases.id,
        merchantId: grcPurchases.merchantId,
        denomination: grcPurchases.denomination,
        quantity: grcPurchases.quantity,
        totalCost: grcPurchases.totalCost,
        paymentMethod: grcPurchases.paymentMethod,
        paymentStatus: grcPurchases.paymentStatus,
        zelleAccountName: grcPurchases.zelleAccountName,
        paymentNotes: grcPurchases.paymentNotes,
        rejectionReason: grcPurchases.rejectionReason,
        createdAt: grcPurchases.createdAt,
        paymentConfirmedAt: grcPurchases.paymentConfirmedAt,
        // Merchant info
        businessName: merchants.businessName,
        merchantEmail: users.email,
        // Bank account info
        bankName: merchantBankAccounts.bankName,
        accountHolderName: merchantBankAccounts.accountHolderName,
        routingNumber: merchantBankAccounts.routingNumberEncrypted,
        accountNumber: merchantBankAccounts.accountNumberEncrypted,
        checkImageUrl: merchantBankAccounts.checkImageUrl,
      })
      .from(grcPurchases)
      .leftJoin(merchants, eq(grcPurchases.merchantId, merchants.id))
      .leftJoin(users, eq(merchants.userId, users.id))
      .leftJoin(merchantBankAccounts, eq(merchants.id, merchantBankAccounts.merchantId))
      .where(whereClause)
      .orderBy(desc(grcPurchases.createdAt))
      .limit(limit)
      .offset(offset);

    // Get stats (always for all orders, not filtered)
    const [stats] = await db
      .select({
        pendingCount: sql<number>`count(*) filter (where ${grcPurchases.paymentStatus} = 'pending')`,
        confirmedCount: sql<number>`count(*) filter (where ${grcPurchases.paymentStatus} = 'confirmed')`,
        failedCount: sql<number>`count(*) filter (where ${grcPurchases.paymentStatus} = 'failed')`,
        totalPending: sql<string>`coalesce(sum(${grcPurchases.totalCost}) filter (where ${grcPurchases.paymentStatus} = 'pending'), 0)`,
        totalConfirmed: sql<string>`coalesce(sum(${grcPurchases.totalCost}) filter (where ${grcPurchases.paymentStatus} = 'confirmed'), 0)`,
      })
      .from(grcPurchases);

    // Transform orders to mask sensitive data and format for frontend
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      merchantId: order.merchantId,
      businessName: order.businessName || "Unknown",
      merchantEmail: order.merchantEmail || "",
      denomination: order.denomination,
      quantity: order.quantity,
      totalCost: order.totalCost,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      zelleAccountName: order.zelleAccountName,
      paymentNotes: order.paymentNotes,
      rejectionReason: order.rejectionReason,
      createdAt: order.createdAt,
      paymentConfirmedAt: order.paymentConfirmedAt,
      // Bank info (partially masked)
      bankInfo: order.bankName ? {
        bankName: order.bankName,
        accountHolderName: order.accountHolderName,
        routingLast4: order.routingNumber?.slice(-4) || "",
        accountLast4: order.accountNumber?.slice(-4) || "",
        // Full numbers for admin view
        routingNumber: order.routingNumber,
        accountNumber: order.accountNumber,
        checkImageUrl: order.checkImageUrl,
      } : null,
    }));

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      stats: {
        pendingCount: Number(stats?.pendingCount) || 0,
        confirmedCount: Number(stats?.confirmedCount) || 0,
        failedCount: Number(stats?.failedCount) || 0,
        totalPending: parseFloat(stats?.totalPending || "0"),
        totalConfirmed: parseFloat(stats?.totalConfirmed || "0"),
      },
    });
  } catch (error) {
    console.error("Admin orders API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
