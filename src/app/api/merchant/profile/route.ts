import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, merchants, categories, merchantBankAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { uploadProfilePhoto, uploadMerchantLogo, validateImageFormat, validateImageSize } from "@/lib/storage";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    // Get merchant profile with category
    const merchantResult = await db
      .select({
        id: merchants.id,
        businessName: merchants.businessName,
        categoryId: merchants.categoryId,
        city: merchants.city,
        state: merchants.state,
        logoUrl: merchants.logoUrl,
        description: merchants.description,
        phone: merchants.phone,
        website: merchants.website,
        googlePlaceId: merchants.googlePlaceId,
        verified: merchants.verified,
        categoryName: categories.name,
      })
      .from(merchants)
      .leftJoin(categories, eq(merchants.categoryId, categories.id))
      .where(eq(merchants.userId, session.user.id))
      .limit(1);

    const merchant = merchantResult[0];

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant profile not found" },
        { status: 400 }
      );
    }

    // Get all categories for the dropdown
    const allCategories = await db.select().from(categories);

    // Get bank account if exists
    const [bankAccount] = await db
      .select()
      .from(merchantBankAccounts)
      .where(eq(merchantBankAccounts.merchantId, merchant.id))
      .limit(1);

    return NextResponse.json({
      profile: {
        email: user.email,
        profilePhotoUrl: user.profilePhotoUrl,
        notificationPrefs: user.notificationPrefs || {
          emailReceipts: true,
          emailReminders: true,
          emailMarketing: false,
        },
        businessName: merchant.businessName,
        categoryId: merchant.categoryId,
        categoryName: merchant.categoryName,
        city: merchant.city,
        state: merchant.state,
        logoUrl: merchant.logoUrl,
        description: merchant.description,
        phone: merchant.phone,
        website: merchant.website,
        googlePlaceId: merchant.googlePlaceId,
        verified: merchant.verified,
        bankAccount: bankAccount ? {
          bankName: bankAccount.bankName,
          accountHolderName: bankAccount.accountHolderName,
          routingLast4: bankAccount.routingNumberEncrypted?.slice(-4) || "",
          accountLast4: bankAccount.accountNumberEncrypted?.slice(-4) || "",
          hasCheckImage: !!bankAccount.checkImageUrl,
          hasAccount: true,
        } : null,
      },
      categories: allCategories,
    });
  } catch (error) {
    console.error("Error fetching merchant profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessName,
      categoryId,
      city,
      state,
      description,
      phone,
      website,
      googlePlaceId,
      notificationPrefs,
      profilePhoto, // Base64 for personal photo
      logo, // Base64 for business logo
      bankAccount, // { bankName, accountHolderName, routingNumber, accountNumber }
    } = body;

    // Get merchant
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, session.user.id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant profile not found" },
        { status: 400 }
      );
    }

    // Handle profile photo upload
    let profilePhotoUrl: string | null | undefined;
    if (profilePhoto) {
      const formatValidation = validateImageFormat(profilePhoto);
      if (!formatValidation.valid) {
        return NextResponse.json(
          { error: formatValidation.error },
          { status: 400 }
        );
      }

      const sizeValidation = validateImageSize(profilePhoto, 5 * 1024 * 1024);
      if (!sizeValidation.valid) {
        return NextResponse.json({ error: sizeValidation.error }, { status: 413 });
      }

      profilePhotoUrl = await uploadProfilePhoto(
        profilePhoto,
        `merchant-${merchant.id}.jpg`
      );
    }

    // Handle logo upload
    let logoUrl: string | null | undefined;
    if (logo) {
      const formatValidation = validateImageFormat(logo);
      if (!formatValidation.valid) {
        return NextResponse.json(
          { error: formatValidation.error },
          { status: 400 }
        );
      }

      const sizeValidation = validateImageSize(logo, 5 * 1024 * 1024);
      if (!sizeValidation.valid) {
        return NextResponse.json({ error: sizeValidation.error }, { status: 413 });
      }

      logoUrl = await uploadMerchantLogo(logo, `logo-${merchant.id}.jpg`);
    }

    // Update user table (notification prefs, profile photo)
    const userUpdates: Record<string, unknown> = {};
    if (notificationPrefs !== undefined) userUpdates.notificationPrefs = notificationPrefs;
    if (profilePhotoUrl) userUpdates.profilePhotoUrl = profilePhotoUrl;

    if (Object.keys(userUpdates).length > 0) {
      await db
        .update(users)
        .set({ ...userUpdates, updatedAt: new Date() })
        .where(eq(users.id, session.user.id));
    }

    // Update merchant table
    const merchantUpdates: Record<string, unknown> = {};
    if (businessName !== undefined) merchantUpdates.businessName = businessName;
    if (categoryId !== undefined) merchantUpdates.categoryId = categoryId;
    if (city !== undefined) merchantUpdates.city = city;
    if (state !== undefined) merchantUpdates.state = state;
    if (description !== undefined) merchantUpdates.description = description;
    if (phone !== undefined) merchantUpdates.phone = phone;
    if (website !== undefined) merchantUpdates.website = website;
    if (googlePlaceId !== undefined) merchantUpdates.googlePlaceId = googlePlaceId;
    if (logoUrl) merchantUpdates.logoUrl = logoUrl;

    if (Object.keys(merchantUpdates).length > 0) {
      await db
        .update(merchants)
        .set(merchantUpdates)
        .where(eq(merchants.id, merchant.id));
    }

    // Update bank account if provided
    if (bankAccount) {
      const [existingBankAccount] = await db
        .select()
        .from(merchantBankAccounts)
        .where(eq(merchantBankAccounts.merchantId, merchant.id))
        .limit(1);

      if (existingBankAccount) {
        // Build update object with only provided fields
        const bankAccountUpdate: Record<string, string | null> = {};
        if (bankAccount.bankName !== undefined) bankAccountUpdate.bankName = bankAccount.bankName || null;
        if (bankAccount.accountHolderName !== undefined) bankAccountUpdate.accountHolderName = bankAccount.accountHolderName;
        if (bankAccount.routingNumber) bankAccountUpdate.routingNumberEncrypted = bankAccount.routingNumber;
        if (bankAccount.accountNumber) bankAccountUpdate.accountNumberEncrypted = bankAccount.accountNumber;
        if (bankAccount.checkImageUrl !== undefined) bankAccountUpdate.checkImageUrl = bankAccount.checkImageUrl;

        if (Object.keys(bankAccountUpdate).length > 0) {
          await db
            .update(merchantBankAccounts)
            .set(bankAccountUpdate)
            .where(eq(merchantBankAccounts.id, existingBankAccount.id));
        }
      } else if (bankAccount.routingNumber && bankAccount.accountNumber) {
        // Only create new account if we have required fields
        await db.insert(merchantBankAccounts).values({
          merchantId: merchant.id,
          bankName: bankAccount.bankName || null,
          accountHolderName: bankAccount.accountHolderName,
          routingNumberEncrypted: bankAccount.routingNumber, // TODO: encrypt
          accountNumberEncrypted: bankAccount.accountNumber, // TODO: encrypt
          accountType: "checking",
          checkImageUrl: bankAccount.checkImageUrl || null,
        });
      }
    }

    return NextResponse.json({ success: true, profilePhotoUrl, logoUrl });
  } catch (error) {
    console.error("Error updating merchant profile:", error);
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
