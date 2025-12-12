import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { grcPurchases, merchants, merchantBankAccounts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== "merchant" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get merchant
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, session.user.id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // Get all orders for this merchant
    const orders = await db
      .select()
      .from(grcPurchases)
      .where(eq(grcPurchases.merchantId, merchant.id))
      .orderBy(desc(grcPurchases.createdAt));

    // Get bank account info if exists
    const [bankAccount] = await db
      .select()
      .from(merchantBankAccounts)
      .where(eq(merchantBankAccounts.merchantId, merchant.id))
      .limit(1);

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        denomination: order.denomination,
        quantity: order.quantity,
        totalCost: order.totalCost,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        zelleAccountName: order.zelleAccountName,
        rejectionReason: order.rejectionReason,
        createdAt: order.createdAt,
        paymentConfirmedAt: order.paymentConfirmedAt,
      })),
      bankAccount: bankAccount ? {
        bankName: bankAccount.bankName,
        accountHolderName: bankAccount.accountHolderName,
        routingLast4: bankAccount.routingNumberEncrypted?.slice(-4) || "",
        accountLast4: bankAccount.accountNumberEncrypted?.slice(-4) || "",
        hasCheckImage: !!bankAccount.checkImageUrl,
      } : null,
    });
  } catch (error) {
    console.error("Merchant orders API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
