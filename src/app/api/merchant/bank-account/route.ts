import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { merchants, merchantBankAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== "merchant" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, session.user.id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const [bankAccount] = await db
      .select()
      .from(merchantBankAccounts)
      .where(eq(merchantBankAccounts.merchantId, merchant.id))
      .limit(1);

    if (!bankAccount) {
      return NextResponse.json({ bankAccount: null });
    }

    return NextResponse.json({
      bankAccount: {
        bankName: bankAccount.bankName,
        accountHolderName: bankAccount.accountHolderName,
        routingLast4: bankAccount.routingNumberEncrypted?.slice(-4) || "",
        accountLast4: bankAccount.accountNumberEncrypted?.slice(-4) || "",
        hasCheckImage: !!bankAccount.checkImageUrl,
      },
    });
  } catch (error) {
    console.error("Get bank account error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== "merchant" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, session.user.id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const body = await request.json();
    const { bankName, accountHolderName, routingNumber, accountNumber, checkImageUrl } = body;

    // Check if bank account exists
    const [existingAccount] = await db
      .select()
      .from(merchantBankAccounts)
      .where(eq(merchantBankAccounts.merchantId, merchant.id))
      .limit(1);

    if (existingAccount) {
      // Update existing account
      const updateData: Record<string, string | null> = {};

      if (bankName !== undefined) updateData.bankName = bankName;
      if (accountHolderName !== undefined) updateData.accountHolderName = accountHolderName;
      if (routingNumber) updateData.routingNumberEncrypted = routingNumber;
      if (accountNumber) updateData.accountNumberEncrypted = accountNumber;
      if (checkImageUrl !== undefined) updateData.checkImageUrl = checkImageUrl;

      await db
        .update(merchantBankAccounts)
        .set(updateData)
        .where(eq(merchantBankAccounts.id, existingAccount.id));

      // Return updated data
      const [updatedAccount] = await db
        .select()
        .from(merchantBankAccounts)
        .where(eq(merchantBankAccounts.id, existingAccount.id))
        .limit(1);

      return NextResponse.json({
        success: true,
        bankAccount: {
          bankName: updatedAccount.bankName,
          accountHolderName: updatedAccount.accountHolderName,
          routingLast4: updatedAccount.routingNumberEncrypted?.slice(-4) || "",
          accountLast4: updatedAccount.accountNumberEncrypted?.slice(-4) || "",
          hasCheckImage: !!updatedAccount.checkImageUrl,
        },
      });
    } else {
      // Create new account
      if (!bankName || !accountHolderName || !routingNumber || !accountNumber) {
        return NextResponse.json(
          { error: "All fields are required for new bank account" },
          { status: 400 }
        );
      }

      const [newAccount] = await db
        .insert(merchantBankAccounts)
        .values({
          merchantId: merchant.id,
          bankName,
          accountHolderName,
          routingNumberEncrypted: routingNumber,
          accountNumberEncrypted: accountNumber,
          accountType: "checking",
          checkImageUrl: checkImageUrl || null,
        })
        .returning();

      return NextResponse.json({
        success: true,
        bankAccount: {
          bankName: newAccount.bankName,
          accountHolderName: newAccount.accountHolderName,
          routingLast4: newAccount.routingNumberEncrypted?.slice(-4) || "",
          accountLast4: newAccount.accountNumberEncrypted?.slice(-4) || "",
          hasCheckImage: !!newAccount.checkImageUrl,
        },
      });
    }
  } catch (error) {
    console.error("Save bank account error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
