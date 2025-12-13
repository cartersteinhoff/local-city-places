import { db, users, merchants, grcPurchases } from "@/db";
import { eq } from "drizzle-orm";

const TRIAL_GRC_QUANTITY = 10;
const TRIAL_GRC_DENOMINATION = 100;

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
  createdBy?: string; // Admin user ID for admin-assisted flow
}

export interface CreateMerchantResult {
  user: typeof users.$inferSelect;
  merchant: typeof merchants.$inferSelect;
  trialPurchase: typeof grcPurchases.$inferSelect;
}

export type EmailValidationError =
  | { type: "member_exists"; message: string }
  | { type: "merchant_exists"; message: string }
  | { type: "admin_exists"; message: string };

/**
 * Validates if an email can be used for a new merchant account
 * Returns null if valid, or an error object if invalid
 */
export async function validateEmailForMerchant(
  email: string
): Promise<EmailValidationError | null> {
  const normalizedEmail = email.toLowerCase().trim();

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!existingUser) {
    return null; // Email is available
  }

  switch (existingUser.role) {
    case "member":
      return {
        type: "member_exists",
        message: "This email is registered as a member and cannot be converted to a merchant account.",
      };
    case "merchant":
      return {
        type: "merchant_exists",
        message: "This email is already registered as a merchant. Please log in instead. Trial GRCs are not available for existing merchants.",
      };
    case "admin":
      return {
        type: "admin_exists",
        message: "This email is registered as an admin and cannot be used for a merchant account.",
      };
    default:
      return {
        type: "member_exists",
        message: "This email is already registered.",
      };
  }
}

/**
 * Creates a new merchant with trial GRCs
 * This handles the full merchant creation including:
 * 1. Creating the user account with merchant role
 * 2. Creating the merchant profile
 * 3. Creating auto-confirmed trial GRC inventory
 */
export async function createMerchantWithTrialGrcs(
  options: CreateMerchantOptions
): Promise<CreateMerchantResult> {
  const normalizedEmail = options.email.toLowerCase().trim();

  // Validate email first
  const validationError = await validateEmailForMerchant(normalizedEmail);
  if (validationError) {
    throw new Error(validationError.message);
  }

  // Create user with merchant role
  const [newUser] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      role: "merchant",
    })
    .returning();

  // Create merchant profile
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

  // Create auto-confirmed trial GRC purchase
  const [trialPurchase] = await db
    .insert(grcPurchases)
    .values({
      merchantId: newMerchant.id,
      denomination: TRIAL_GRC_DENOMINATION,
      quantity: TRIAL_GRC_QUANTITY,
      totalCost: "0.00",
      paymentMethod: "bank_account", // Placeholder for trial
      paymentStatus: "confirmed", // Auto-confirmed
      isTrial: true,
      paymentConfirmedAt: new Date(),
      paymentConfirmedBy: options.createdBy || null,
      paymentNotes: "Trial GRCs - automatically issued on merchant onboarding",
    })
    .returning();

  return {
    user: newUser,
    merchant: newMerchant,
    trialPurchase,
  };
}

export { TRIAL_GRC_QUANTITY, TRIAL_GRC_DENOMINATION };
