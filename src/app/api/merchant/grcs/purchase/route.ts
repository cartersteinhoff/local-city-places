import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, grcPurchases, merchants, merchantBankAccounts } from "@/db";
import { eq } from "drizzle-orm";

// GRC pricing tiers (cost per certificate)
const GRC_PRICING: Record<number, number> = {
  50: 1.25, 75: 1.50, 100: 1.75, 125: 2.00, 150: 2.25,
  175: 2.50, 200: 2.75, 225: 3.00, 250: 3.25, 275: 3.50,
  300: 3.75, 325: 4.00, 350: 4.25, 375: 4.50, 400: 4.75,
  425: 5.00, 450: 5.25, 475: 5.50, 500: 5.75,
};

// Available denominations
export const DENOMINATIONS = Object.keys(GRC_PRICING).map(Number);

export async function GET() {
  try {
    const session = await getSession();

    // Return pricing info for the purchase form
    const pricing = DENOMINATIONS.map((denomination) => ({
      denomination,
      costPerCert: GRC_PRICING[denomination],
    }));

    // Get saved payment info if logged in as merchant
    let savedPaymentInfo = null;
    if (session && (session.user.role === "merchant" || session.user.role === "admin")) {
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, session.user.id))
        .limit(1);

      if (merchant) {
        // Get bank account if exists
        const [bankAccount] = await db
          .select()
          .from(merchantBankAccounts)
          .where(eq(merchantBankAccounts.merchantId, merchant.id))
          .limit(1);

        savedPaymentInfo = {
          bankAccount: bankAccount ? {
            bankName: bankAccount.bankName || "",
            accountHolderName: bankAccount.accountHolderName,
            routingLast4: bankAccount.routingNumberEncrypted?.slice(-4) || "",
            accountLast4: bankAccount.accountNumberEncrypted?.slice(-4) || "",
            hasCheckImage: !!bankAccount.checkImageUrl,
          } : null,
        };
      }
    }

    return NextResponse.json({ pricing, savedPaymentInfo });
  } catch (error) {
    console.error("GET pricing error:", error);
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

    const body = await request.json();
    const { denomination, quantity, paymentMethod, paymentInfo, saveBankInfo, totalOrderQuantity } = body;

    // Validate denomination
    if (!DENOMINATIONS.includes(denomination)) {
      return NextResponse.json(
        { error: "Invalid denomination" },
        { status: 400 }
      );
    }

    // Validate quantity
    if (!quantity || quantity < 1 || quantity > 1000) {
      return NextResponse.json(
        { error: "Quantity must be between 1 and 1000" },
        { status: 400 }
      );
    }

    // Validate minimum order of 50 total GRCs
    if (!totalOrderQuantity || totalOrderQuantity < 50) {
      return NextResponse.json(
        { error: "Minimum order is 50 GRCs" },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!["business_check", "zelle"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
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

    // Handle Zelle payment
    let zelleAccountName: string | null = null;
    if (paymentMethod === "zelle") {
      if (!paymentInfo?.zelleAccountName) {
        return NextResponse.json(
          { error: "Zelle account name is required" },
          { status: 400 }
        );
      }
      zelleAccountName = paymentInfo.zelleAccountName;
    }

    // Handle business check payment
    if (paymentMethod === "business_check") {
      if (paymentInfo?.useSavedBank) {
        // Using saved bank account - verify it exists
        const [existingBankAccount] = await db
          .select()
          .from(merchantBankAccounts)
          .where(eq(merchantBankAccounts.merchantId, merchant.id))
          .limit(1);

        if (!existingBankAccount) {
          return NextResponse.json(
            { error: "No saved bank account found" },
            { status: 400 }
          );
        }

        // Update check image if provided
        if (paymentInfo.checkImageUrl && !existingBankAccount.checkImageUrl) {
          await db
            .update(merchantBankAccounts)
            .set({ checkImageUrl: paymentInfo.checkImageUrl })
            .where(eq(merchantBankAccounts.id, existingBankAccount.id));
        }
      } else {
        // New bank account details
        if (!paymentInfo?.bankName || !paymentInfo?.routingNumber ||
            !paymentInfo?.accountNumber || !paymentInfo?.accountHolderName) {
          return NextResponse.json(
            { error: "Complete bank account details are required" },
            { status: 400 }
          );
        }

        // Save bank info if requested
        if (saveBankInfo) {
          // Check if bank account exists
          const [existingBankAccount] = await db
            .select()
            .from(merchantBankAccounts)
            .where(eq(merchantBankAccounts.merchantId, merchant.id))
            .limit(1);

          if (existingBankAccount) {
            // Update existing
            await db
              .update(merchantBankAccounts)
              .set({
                bankName: paymentInfo.bankName,
                accountHolderName: paymentInfo.accountHolderName,
                routingNumberEncrypted: paymentInfo.routingNumber, // TODO: encrypt
                accountNumberEncrypted: paymentInfo.accountNumber, // TODO: encrypt
                checkImageUrl: paymentInfo.checkImageUrl || null,
              })
              .where(eq(merchantBankAccounts.id, existingBankAccount.id));
          } else {
            // Create new
            await db.insert(merchantBankAccounts).values({
              merchantId: merchant.id,
              bankName: paymentInfo.bankName,
              accountHolderName: paymentInfo.accountHolderName,
              routingNumberEncrypted: paymentInfo.routingNumber, // TODO: encrypt
              accountNumberEncrypted: paymentInfo.accountNumber, // TODO: encrypt
              accountType: "checking",
              checkImageUrl: paymentInfo.checkImageUrl || null,
            });
          }
        }
      }
    }

    // Calculate total cost
    const costPerCert = GRC_PRICING[denomination];
    const totalCost = (costPerCert * quantity).toFixed(2);

    // Create purchase record
    const [purchase] = await db
      .insert(grcPurchases)
      .values({
        merchantId: merchant.id,
        denomination,
        quantity,
        totalCost,
        paymentMethod,
        paymentStatus: "pending",
        zelleAccountName,
      })
      .returning();

    return NextResponse.json({
      success: true,
      purchase: {
        id: purchase.id,
        denomination,
        quantity,
        costPerCert,
        totalCost: Number.parseFloat(totalCost),
        paymentMethod,
        paymentStatus: "pending",
      },
    });
  } catch (error) {
    console.error("Purchase API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
