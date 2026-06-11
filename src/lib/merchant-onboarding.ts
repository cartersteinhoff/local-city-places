import { eq } from "drizzle-orm";
import { db, merchantOwners, merchants, users } from "@/db";

export interface CreateMerchantOptions {
  email: string;
  businessName: string;
  city?: string;
  state?: string;
  categoryId?: string;
  phone?: string;
  website?: string;
  description?: string;
  logoUrl?: string;
  googlePlaceId?: string;
}

export interface CreateMerchantResult {
  user: typeof users.$inferSelect;
  merchant: typeof merchants.$inferSelect;
}

export type EmailValidationError =
  | { type: "member_exists"; message: string }
  | { type: "merchant_exists"; message: string }
  | { type: "admin_exists"; message: string };

export async function validateEmailForMerchant(
  email: string,
): Promise<EmailValidationError | null> {
  const normalizedEmail = email.toLowerCase().trim();

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!existingUser) {
    return null;
  }

  switch (existingUser.role) {
    case "member":
      return {
        type: "member_exists",
        message:
          "This email is registered as a member and cannot be converted to a merchant account.",
      };
    case "merchant":
      return {
        type: "merchant_exists",
        message:
          "This email is already registered as a merchant. Please log in instead.",
      };
    case "admin":
      return {
        type: "admin_exists",
        message:
          "This email is registered as an admin and cannot be used for a merchant account.",
      };
    default:
      return {
        type: "member_exists",
        message: "This email is already registered.",
      };
  }
}

export async function createMerchantAccount(
  options: CreateMerchantOptions,
): Promise<CreateMerchantResult> {
  const normalizedEmail = options.email.toLowerCase().trim();

  const validationError = await validateEmailForMerchant(normalizedEmail);
  if (validationError) {
    throw new Error(validationError.message);
  }

  const [newUser] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      role: "merchant",
    })
    .returning();

  const [newMerchant] = await db
    .insert(merchants)
    .values({
      userId: newUser.id,
      businessName: options.businessName,
      city: options.city,
      state: options.state,
      categoryId: options.categoryId,
      phone: options.phone,
      website: options.website,
      description: options.description,
      logoUrl: options.logoUrl,
      googlePlaceId: options.googlePlaceId,
      verified: false,
    })
    .returning();

  await db.insert(merchantOwners).values({
    merchantId: newMerchant.id,
    userId: newUser.id,
  });

  return {
    user: newUser,
    merchant: newMerchant,
  };
}
