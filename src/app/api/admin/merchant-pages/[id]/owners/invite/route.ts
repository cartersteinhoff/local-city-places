import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db, merchants, users } from "@/db";
import {
  addMerchantManager,
  formatMerchantManager,
  getMerchantManagers,
} from "@/lib/admin-merchant-managers";
import { createMagicLinkToken, getSession } from "@/lib/auth";
import { sendMerchantWelcomeEmail } from "@/lib/email";
import { stripPhoneNumber } from "@/lib/utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const [merchant] = await db
      .select({
        id: merchants.id,
        userId: merchants.userId,
        businessName: merchants.businessName,
      })
      .from(merchants)
      .where(eq(merchants.id, id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const firstName = cleanOptionalString(body.firstName);
    const lastName = cleanOptionalString(body.lastName);
    const rawPhone = cleanOptionalString(body.phone);
    const phone = rawPhone ? stripPhoneNumber(rawPhone) || null : null;
    const shouldSendWelcomeEmail = body.sendWelcomeEmail !== false;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address" },
        { status: 400 },
      );
    }

    let [managerUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    let createdUser = false;

    if (managerUser) {
      if (managerUser.role === "member") {
        return NextResponse.json(
          {
            error:
              "This email is registered as a member and cannot be used for a merchant dashboard manager.",
          },
          { status: 400 },
        );
      }

      if (managerUser.role !== "merchant" && managerUser.role !== "admin") {
        return NextResponse.json(
          { error: "Managers must be merchant or admin users" },
          { status: 400 },
        );
      }

      const updates: Partial<typeof users.$inferInsert> = {};
      if (firstName !== null) updates.firstName = firstName;
      if (lastName !== null) updates.lastName = lastName;
      if (phone !== null) updates.phone = phone;

      if (Object.keys(updates).length > 0) {
        const [updatedUser] = await db
          .update(users)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(users.id, managerUser.id))
          .returning();

        managerUser = updatedUser;
      }
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          firstName,
          lastName,
          phone,
          role: "merchant",
        })
        .returning();

      managerUser = newUser;
      createdUser = true;
    }

    await addMerchantManager({
      merchantId: merchant.id,
      userId: managerUser.id,
      createdBy: session.user.id,
    });

    let emailSent = false;
    if (shouldSendWelcomeEmail) {
      const token = await createMagicLinkToken(managerUser.email, "/merchant");
      const loginUrl = `${APP_URL}/api/auth/verify?token=${token}`;
      emailSent = await sendMerchantWelcomeEmail({
        email: managerUser.email,
        businessName: merchant.businessName,
        loginUrl,
      });
    }

    return NextResponse.json({
      success: true,
      createdUser,
      emailSent,
      owner: formatMerchantManager(managerUser),
      owners: await getMerchantManagers(merchant.id, merchant.userId),
    });
  } catch (error) {
    console.error("Error creating merchant manager invite:", error);
    return NextResponse.json(
      { error: "Failed to create manager and send welcome email" },
      { status: 500 },
    );
  }
}
