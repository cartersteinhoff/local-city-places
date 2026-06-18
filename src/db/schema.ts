import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { MarketLockStatus } from "@/lib/market-lock-status";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "member",
  "merchant",
  "admin",
]);
export const sweepstakesCycleStatusEnum = pgEnum("sweepstakes_cycle_status", [
  "open",
  "closed",
  "drawn",
]);
export const sweepstakesEntryStatusEnum = pgEnum("sweepstakes_entry_status", [
  "pending",
  "confirmed",
  "void",
]);
export const sweepstakesEntrySourceEnum = pgEnum("sweepstakes_entry_source", [
  "campaign_page",
  "dashboard",
]);
export const sweepstakesWinnerTierEnum = pgEnum("sweepstakes_winner_tier", [
  "grand_prize",
  "tier1_match",
  "tier2_match",
]);
export const sweepstakesWinnerStatusEnum = pgEnum("sweepstakes_winner_status", [
  "active",
  "superseded",
]);
export const sweepstakesWinnerSelectionMethodEnum = pgEnum(
  "sweepstakes_winner_selection_method",
  ["draw", "manual_override"],
);
export const favoriteMerchantTestimonialStatusEnum = pgEnum(
  "favorite_merchant_testimonial_status",
  ["submitted", "changes_requested", "approved", "rejected"],
);
export const favoriteMerchantTestimonialPhotoStatusEnum = pgEnum(
  "favorite_merchant_testimonial_photo_status",
  ["pending", "approved", "rejected"],
);
export const merchantRequestStatusEnum = pgEnum("merchant_request_status", [
  "new",
  "in_review",
  "waitlisted",
  "fulfilled",
  "invited",
  "rejected",
]);
export const merchantRequestCategoryStatusEnum = pgEnum(
  "merchant_request_category_status",
  ["requested", "assigned", "waitlisted"],
);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  role: userRoleEnum("role").notNull().default("member"),
  profilePhotoUrl: text("profile_photo_url"),
  notificationPrefs: jsonb("notification_prefs").$type<{
    emailActivity?: boolean;
    emailReminders?: boolean;
    emailMarketing?: boolean;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Members table
export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  address: varchar("address", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zip: varchar("zip", { length: 20 }),
  homeCity: varchar("home_city", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sweepstakes cycles table
export const sweepstakesCycles = pgTable(
  "sweepstakes_cycles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    year: integer("year").notNull(),
    month: integer("month").notNull(), // 1-12 in Arizona time
    name: varchar("name", { length: 120 }).notNull(),
    startsAt: timestamp("starts_at").notNull(),
    endsAt: timestamp("ends_at").notNull(),
    status: sweepstakesCycleStatusEnum("status").notNull().default("open"),
    grandPrizeLabel: varchar("grand_prize_label", { length: 255 })
      .notNull()
      .default("500 in Gas or Groceries"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("sweepstakes_cycles_year_month_idx").on(
      table.year,
      table.month,
    ),
  ],
);

// Sweepstakes referral codes table
export const sweepstakesReferralCodes = pgTable(
  "sweepstakes_referral_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 32 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("sweepstakes_referral_codes_member_idx").on(table.memberId),
    uniqueIndex("sweepstakes_referral_codes_code_idx").on(table.code),
  ],
);

// Sweepstakes referral relationships table
export const memberReferrals = pgTable(
  "member_referrals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referrerMemberId: uuid("referrer_member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    referredMemberId: uuid("referred_member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    referralCodeUsed: varchar("referral_code_used", { length: 32 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("member_referrals_referred_member_idx").on(
      table.referredMemberId,
    ),
  ],
);

// Sweepstakes entries table
export const sweepstakesEntries = pgTable(
  "sweepstakes_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cycleId: uuid("cycle_id")
      .notNull()
      .references(() => sweepstakesCycles.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    entryName: varchar("entry_name", { length: 255 }).notNull(),
    entryEmail: varchar("entry_email", { length: 255 }).notNull(),
    entryLocalDate: varchar("entry_local_date", { length: 10 }).notNull(), // YYYY-MM-DD in Arizona time
    status: sweepstakesEntryStatusEnum("status").notNull().default("pending"),
    source: sweepstakesEntrySourceEnum("source")
      .notNull()
      .default("campaign_page"),
    referralCodeUsed: varchar("referral_code_used", { length: 32 }),
    confirmedAt: timestamp("confirmed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("sweepstakes_entries_user_local_date_idx").on(
      table.userId,
      table.entryLocalDate,
    ),
  ],
);

// Sweepstakes referral activations table
export const sweepstakesReferralActivations = pgTable(
  "sweepstakes_referral_activations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cycleId: uuid("cycle_id")
      .notNull()
      .references(() => sweepstakesCycles.id, { onDelete: "cascade" }),
    referrerMemberId: uuid("referrer_member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    referredMemberId: uuid("referred_member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    activatingEntryId: uuid("activating_entry_id")
      .notNull()
      .references(() => sweepstakesEntries.id, { onDelete: "cascade" }),
    activatedAt: timestamp("activated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("sweepstakes_referral_activations_unique_idx").on(
      table.cycleId,
      table.referrerMemberId,
      table.referredMemberId,
    ),
  ],
);

// Sweepstakes winners table
export const sweepstakesWinners = pgTable(
  "sweepstakes_winners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cycleId: uuid("cycle_id")
      .notNull()
      .references(() => sweepstakesCycles.id, { onDelete: "cascade" }),
    selectionGroupId: uuid("selection_group_id").notNull(),
    prizeTier: sweepstakesWinnerTierEnum("prize_tier").notNull(),
    winnerMemberId: uuid("winner_member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    grandWinnerMemberId: uuid("grand_winner_member_id").references(
      () => members.id,
      {
        onDelete: "set null",
      },
    ),
    selectedByUserId: uuid("selected_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    selectionMethod:
      sweepstakesWinnerSelectionMethodEnum("selection_method").notNull(),
    status: sweepstakesWinnerStatusEnum("status").notNull().default("active"),
    regularEntryCount: integer("regular_entry_count").notNull().default(0),
    referralEntryCount: integer("referral_entry_count").notNull().default(0),
    totalEntries: integer("total_entries").notNull().default(0),
    notes: text("notes"),
    emailSentAt: timestamp("email_sent_at"),
    emailSentTo: varchar("email_sent_to", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("sweepstakes_winners_cycle_status_idx").on(
      table.cycleId,
      table.status,
    ),
    index("sweepstakes_winners_cycle_tier_status_idx").on(
      table.cycleId,
      table.prizeTier,
      table.status,
    ),
    index("sweepstakes_winners_cycle_group_idx").on(
      table.cycleId,
      table.selectionGroupId,
    ),
  ],
);

// Favorite merchant testimonials table
export const favoriteMerchantTestimonials = pgTable(
  "favorite_merchant_testimonials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cycleId: uuid("cycle_id")
      .notNull()
      .references(() => sweepstakesCycles.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    wordCount: integer("word_count").notNull(),
    status: favoriteMerchantTestimonialStatusEnum("status")
      .notNull()
      .default("submitted"),
    moderationNotes: text("moderation_notes"),
    approvedAt: timestamp("approved_at"),
    approvedBy: uuid("approved_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("favorite_merchant_testimonials_member_cycle_merchant_idx").on(
      table.memberId,
      table.cycleId,
      table.merchantId,
    ),
  ],
);

// Favorite merchant testimonial photos table
export const favoriteMerchantTestimonialPhotos = pgTable(
  "favorite_merchant_testimonial_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    testimonialId: uuid("testimonial_id")
      .notNull()
      .references(() => favoriteMerchantTestimonials.id, {
        onDelete: "cascade",
      }),
    url: text("url").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    status: favoriteMerchantTestimonialPhotoStatusEnum("status")
      .notNull()
      .default("pending"),
    moderatedAt: timestamp("moderated_at"),
    moderatedBy: uuid("moderated_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("favorite_merchant_testimonial_photos_testimonial_status_idx").on(
      table.testimonialId,
      table.status,
    ),
  ],
);

// Review status enum
export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "approved",
  "rejected",
]);

// Category groups table
export const categoryGroups = pgTable("category_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull(),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  bgColor: varchar("bg_color", { length: 20 }),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Categories table
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  groupId: uuid("group_id").references(() => categoryGroups.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export interface MerchantCampaignAudioAsset {
  title: string;
  description?: string;
  url: string;
  fileName?: string;
  contentType?: string;
  sizeBytes?: number;
  uploadedAt?: string;
  status?: "ready" | "in_production" | "pending";
}

export interface MerchantCampaignAudio {
  radioSpot?: MerchantCampaignAudioAsset | null;
  soundtrack?: MerchantCampaignAudioAsset | null;
  showOnProfile?: boolean;
  updatedAt?: string;
}

// Merchants table
export const merchants = pgTable("merchants", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }), // Nullable for admin-created "page only" merchants
  businessName: varchar("business_name", { length: 255 }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id),
  streetAddress: varchar("street_address", { length: 255 }), // Full street address (e.g., "123 Main St")
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }), // 2-letter state code (e.g., "CO", "CA")
  zipCode: varchar("zip_code", { length: 10 }), // ZIP code (e.g., "80202")
  logoUrl: text("logo_url"),
  description: text("description"),
  phone: varchar("phone", { length: 20 }),
  website: varchar("website", { length: 255 }),
  googlePlaceId: varchar("google_place_id", { length: 255 }), // For Google Places integration
  vimeoUrl: text("vimeo_url"), // Full Vimeo URL for video embed
  slug: varchar("slug", { length: 255 }), // SEO-friendly slug (business-name-abc123)
  isPublicPage: boolean("is_public_page").default(false), // True for admin-created "page only" merchants
  // Extended business info
  hours: jsonb("hours").$type<{
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  }>(), // Hours of operation by day
  instagramUrl: varchar("instagram_url", { length: 255 }),
  facebookUrl: varchar("facebook_url", { length: 255 }),
  tiktokUrl: varchar("tiktok_url", { length: 255 }),
  photos: jsonb("photos").$type<string[]>(), // Array of photo URLs
  services:
    jsonb("services").$type<
      { name: string; description?: string; price?: string }[]
    >(), // Services/menu items
  aboutStory: text("about_story"), // Longer about/history section
  campaignAudio: jsonb("campaign_audio").$type<MerchantCampaignAudio>(),
  marketLockStatus: varchar("market_lock_status", { length: 20 })
    .$type<MarketLockStatus>()
    .default("basic")
    .notNull(),
  marketLockStatusUpdatedAt: timestamp("market_lock_status_updated_at")
    .defaultNow()
    .notNull(),
  featuredOnHomepage: boolean("featured_on_homepage").default(false).notNull(),
  googleRating: decimal("google_rating", { precision: 2, scale: 1 }),
  googleReviewCount: integer("google_review_count"),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Merchant owners join table. `merchants.userId` remains as the legacy primary
// owner for backwards compatibility, while this table supports shared access.
export const merchantOwners = pgTable(
  "merchant_owners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull().default("owner"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => users.id),
  },
  (table) => [
    uniqueIndex("merchant_owners_merchant_user_idx").on(
      table.merchantId,
      table.userId,
    ),
    uniqueIndex("merchant_owners_user_unique_idx").on(table.userId),
    index("merchant_owners_merchant_idx").on(table.merchantId),
  ],
);

// Merchant bank accounts table
export const merchantBankAccounts = pgTable("merchant_bank_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  bankName: varchar("bank_name", { length: 255 }), // Name of the bank
  routingNumberEncrypted: text("routing_number_encrypted").notNull(),
  accountNumberEncrypted: text("account_number_encrypted").notNull(),
  accountType: varchar("account_type", { length: 20 }).notNull(), // checking or savings
  accountHolderName: varchar("account_holder_name", { length: 255 }).notNull(),
  checkImageUrl: text("check_image_url"), // Photo of check for verification
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Merchant services agreement acceptance records
export const merchantServiceAgreementAcceptances = pgTable(
  "merchant_service_agreement_acceptances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    agreementVersion: varchar("agreement_version", { length: 20 }).notNull(),
    agreementTitle: varchar("agreement_title", { length: 255 }).notNull(),
    agreementContentHash: varchar("agreement_content_hash", {
      length: 64,
    }).notNull(),
    agreementTextSnapshot: text("agreement_text_snapshot").notNull(),
    typedName: varchar("typed_name", { length: 255 }).notNull(),
    servicePeriodStart: timestamp("service_period_start").notNull(),
    servicePeriodEnd: timestamp("service_period_end").notNull(),
    servicePeriodLabel: varchar("service_period_label", {
      length: 120,
    }).notNull(),
    agreementPdfUrl: text("agreement_pdf_url"),
    agreementPdfPath: text("agreement_pdf_path"),
    agreementPdfGeneratedAt: timestamp("agreement_pdf_generated_at"),
    checkoutSessionId: varchar("checkout_session_id", { length: 255 }),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", {
      length: 255,
    }),
    paymentStatus: varchar("payment_status", { length: 32 }),
    paymentAmountCents: integer("payment_amount_cents"),
    paymentCurrency: varchar("payment_currency", { length: 3 }),
    paidAt: timestamp("paid_at"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    acceptedAt: timestamp("accepted_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("merchant_service_agreement_acceptances_merchant_idx").on(
      table.merchantId,
    ),
    index("merchant_service_agreement_acceptances_user_idx").on(table.userId),
    index("merchant_service_agreement_acceptances_version_idx").on(
      table.agreementVersion,
    ),
    index("merchant_service_agreement_acceptances_period_idx").on(
      table.merchantId,
      table.servicePeriodStart,
    ),
  ],
);

// Reviews table
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  memberId: uuid("member_id").references(() => members.id, {
    onDelete: "cascade",
  }),
  content: text("content").notNull(),
  wordCount: integer("word_count").notNull(),
  rating: integer("rating"),
  status: reviewStatusEnum("status").default("approved"),
  // Denormalized reviewer info for imported v1 reviews (no user account)
  reviewerFirstName: varchar("reviewer_first_name", { length: 100 }),
  reviewerLastName: varchar("reviewer_last_name", { length: 100 }),
  reviewerPhotoUrl: text("reviewer_photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Review photos table
export const reviewPhotos = pgTable("review_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  reviewId: uuid("review_id")
    .notNull()
    .references(() => reviews.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Marketplace offers table
export const marketplaceOffers = pgTable("marketplace_offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Offer claims table
export const offerClaims = pgTable("offer_claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  offerId: uuid("offer_id")
    .notNull()
    .references(() => marketplaceOffers.id, { onDelete: "cascade" }),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  claimedAt: timestamp("claimed_at").defaultNow().notNull(),
});

// Magic link tokens table (for auth)
export const magicLinkTokens = pgTable("magic_link_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  callbackUrl: varchar("callback_url", { length: 500 }),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Merchant invites table (for merchant onboarding)
export const merchantInvites = pgTable("merchant_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 255 }), // Optional - can pre-fill email on onboarding form
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  usedByUserId: uuid("used_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
});

// Public merchant request intake table
export const merchantRequests = pgTable(
  "merchant_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessName: varchar("business_name", { length: 255 }).notNull(),
    ownerName: varchar("owner_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    mobilePhone: varchar("mobile_phone", { length: 20 }).notNull(),
    website: varchar("website", { length: 255 }),
    businessAddress1: varchar("business_address_1", {
      length: 255,
    }).notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 2 }).notNull(),
    zipCode: varchar("zip_code", { length: 10 }).notNull(),
    requestedCategory: varchar("requested_category", {
      length: 120,
    }).notNull(),
    yearsInBusiness: integer("years_in_business"),
    shortDescription: text("short_description").notNull(),
    logoUrl: text("logo_url"),
    logoFileName: varchar("logo_file_name", { length: 255 }),
    photoUrls: jsonb("photo_urls").$type<string[]>(),
    photoFileNames: jsonb("photo_file_names").$type<string[]>(),
    permissionGranted: boolean("permission_granted").default(false).notNull(),
    status: merchantRequestStatusEnum("status").notNull().default("new"),
    categoryStatus: merchantRequestCategoryStatusEnum("category_status")
      .notNull()
      .default("requested"),
    adminNotes: text("admin_notes"),
    merchantId: uuid("merchant_id").references(() => merchants.id, {
      onDelete: "set null",
    }),
    merchantInviteId: uuid("merchant_invite_id").references(
      () => merchantInvites.id,
      { onDelete: "set null" },
    ),
    inviteSentAt: timestamp("invite_sent_at"),
    fulfilledAt: timestamp("fulfilled_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("merchant_requests_status_idx").on(table.status),
    index("merchant_requests_created_at_idx").on(table.createdAt),
    index("merchant_requests_email_idx").on(table.email),
    index("merchant_requests_category_priority_idx").on(
      table.city,
      table.state,
      table.requestedCategory,
      table.createdAt,
    ),
  ],
);

// ============================================================================
// EMAIL MARKETING TABLES
// ============================================================================

// Enums for email campaigns
export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "sending",
  "sent",
  "failed",
]);
export const recipientStatusEnum = pgEnum("recipient_status", [
  "pending",
  "sent",
  "failed",
  "bounced",
]);

// Email campaigns table
export const emailCampaigns = pgTable("email_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: varchar("subject", { length: 255 }).notNull(),
  previewText: varchar("preview_text", { length: 255 }),
  content: text("content").notNull(), // HTML content
  recipientType: varchar("recipient_type", { length: 50 }).notNull(), // 'all', 'members', 'merchants', 'admins', 'custom', 'individual'
  recipientLists: jsonb("recipient_lists").$type<string[]>(), // For multi-select lists ['members', 'merchants']
  recipientCount: integer("recipient_count").notNull().default(0),
  individualRecipientId: uuid("individual_recipient_id").references(
    () => users.id,
  ),
  status: campaignStatusEnum("status").notNull().default("draft"),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Stats (updated by Postmark webhooks or sync)
  totalSent: integer("total_sent").default(0),
  totalOpened: integer("total_opened").default(0),
  totalClicked: integer("total_clicked").default(0),
  totalBounced: integer("total_bounced").default(0),
  uniqueOpens: integer("unique_opens").default(0),
  uniqueClicks: integer("unique_clicks").default(0),
  postmarkBatchId: varchar("postmark_batch_id", { length: 100 }),
});

// Campaign recipients table (for tracking individual sends)
export const campaignRecipients = pgTable(
  "campaign_recipients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => emailCampaigns.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }),
    status: recipientStatusEnum("status").notNull().default("pending"),
    sentAt: timestamp("sent_at"),
    openedAt: timestamp("opened_at"),
    clickedAt: timestamp("clicked_at"),
    bouncedAt: timestamp("bounced_at"),
    postmarkMessageId: varchar("postmark_message_id", { length: 100 }),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("campaign_recipient_unique_idx").on(
      table.campaignId,
      table.email,
    ),
  ],
);

// Email logs table (for transactional email history)
export const emailLogs = pgTable("email_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  emailType: varchar("email_type", { length: 50 }).notNull(), // 'magic_link', 'welcome', 'grc_issued', etc.
  status: varchar("status", { length: 20 }).notNull(), // 'sent', 'failed'
  postmarkId: varchar("postmark_id", { length: 100 }),
  subject: varchar("subject", { length: 255 }),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  error: text("error"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

// Email preferences table (for unsubscribe management)
export const emailPreferences = pgTable("email_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  unsubscribedAll: boolean("unsubscribed_all").default(false),
  marketingEmails: boolean("marketing_emails").default(true),
  transactionalEmails: boolean("transactional_emails").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  member: one(members, {
    fields: [users.id],
    references: [members.userId],
  }),
  merchant: one(merchants, {
    fields: [users.id],
    references: [merchants.userId],
  }),
  merchantOwnerships: many(merchantOwners),
  merchantAgreementAcceptances: many(merchantServiceAgreementAcceptances),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
  reviews: many(reviews),
  favoriteMerchantTestimonials: many(favoriteMerchantTestimonials),
  offerClaims: many(offerClaims),
}));

export const categoryGroupsRelations = relations(
  categoryGroups,
  ({ many }) => ({
    categories: many(categories),
  }),
);

export const categoriesRelations = relations(categories, ({ one }) => ({
  group: one(categoryGroups, {
    fields: [categories.groupId],
    references: [categoryGroups.id],
  }),
}));

export const merchantsRelations = relations(merchants, ({ one, many }) => ({
  user: one(users, {
    fields: [merchants.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [merchants.categoryId],
    references: [categories.id],
  }),
  bankAccount: one(merchantBankAccounts, {
    fields: [merchants.id],
    references: [merchantBankAccounts.merchantId],
  }),
  reviews: many(reviews),
  favoriteMerchantTestimonials: many(favoriteMerchantTestimonials),
  marketplaceOffers: many(marketplaceOffers),
  owners: many(merchantOwners),
  agreementAcceptances: many(merchantServiceAgreementAcceptances),
}));

export const merchantOwnersRelations = relations(merchantOwners, ({ one }) => ({
  merchant: one(merchants, {
    fields: [merchantOwners.merchantId],
    references: [merchants.id],
  }),
  user: one(users, {
    fields: [merchantOwners.userId],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [merchantOwners.createdBy],
    references: [users.id],
  }),
}));

export const merchantServiceAgreementAcceptancesRelations = relations(
  merchantServiceAgreementAcceptances,
  ({ one }) => ({
    merchant: one(merchants, {
      fields: [merchantServiceAgreementAcceptances.merchantId],
      references: [merchants.id],
    }),
    user: one(users, {
      fields: [merchantServiceAgreementAcceptances.userId],
      references: [users.id],
    }),
  }),
);

export const merchantInvitesRelations = relations(
  merchantInvites,
  ({ one }) => ({
    createdByUser: one(users, {
      fields: [merchantInvites.createdBy],
      references: [users.id],
    }),
    usedByUser: one(users, {
      fields: [merchantInvites.usedByUserId],
      references: [users.id],
    }),
  }),
);

export const merchantRequestsRelations = relations(
  merchantRequests,
  ({ one }) => ({
    merchant: one(merchants, {
      fields: [merchantRequests.merchantId],
      references: [merchants.id],
    }),
    merchantInvite: one(merchantInvites, {
      fields: [merchantRequests.merchantInviteId],
      references: [merchantInvites.id],
    }),
  }),
);

// Email marketing relations
export const emailCampaignsRelations = relations(
  emailCampaigns,
  ({ one, many }) => ({
    createdByUser: one(users, {
      fields: [emailCampaigns.createdBy],
      references: [users.id],
    }),
    individualRecipient: one(users, {
      fields: [emailCampaigns.individualRecipientId],
      references: [users.id],
    }),
    recipients: many(campaignRecipients),
  }),
);

export const campaignRecipientsRelations = relations(
  campaignRecipients,
  ({ one }) => ({
    campaign: one(emailCampaigns, {
      fields: [campaignRecipients.campaignId],
      references: [emailCampaigns.id],
    }),
    user: one(users, {
      fields: [campaignRecipients.userId],
      references: [users.id],
    }),
  }),
);

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  user: one(users, {
    fields: [emailLogs.userId],
    references: [users.id],
  }),
}));

export const emailPreferencesRelations = relations(
  emailPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [emailPreferences.userId],
      references: [users.id],
    }),
  }),
);

export const reviewPhotosRelations = relations(reviewPhotos, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewPhotos.reviewId],
    references: [reviews.id],
  }),
}));

export const favoriteMerchantTestimonialsRelations = relations(
  favoriteMerchantTestimonials,
  ({ one, many }) => ({
    cycle: one(sweepstakesCycles, {
      fields: [favoriteMerchantTestimonials.cycleId],
      references: [sweepstakesCycles.id],
    }),
    member: one(members, {
      fields: [favoriteMerchantTestimonials.memberId],
      references: [members.id],
    }),
    merchant: one(merchants, {
      fields: [favoriteMerchantTestimonials.merchantId],
      references: [merchants.id],
    }),
    approvedByUser: one(users, {
      fields: [favoriteMerchantTestimonials.approvedBy],
      references: [users.id],
    }),
    photos: many(favoriteMerchantTestimonialPhotos),
  }),
);

export const favoriteMerchantTestimonialPhotosRelations = relations(
  favoriteMerchantTestimonialPhotos,
  ({ one }) => ({
    testimonial: one(favoriteMerchantTestimonials, {
      fields: [favoriteMerchantTestimonialPhotos.testimonialId],
      references: [favoriteMerchantTestimonials.id],
    }),
    moderatedByUser: one(users, {
      fields: [favoriteMerchantTestimonialPhotos.moderatedBy],
      references: [users.id],
    }),
  }),
);

export const sweepstakesWinnersRelations = relations(
  sweepstakesWinners,
  ({ one }) => ({
    cycle: one(sweepstakesCycles, {
      fields: [sweepstakesWinners.cycleId],
      references: [sweepstakesCycles.id],
    }),
    winnerMember: one(members, {
      fields: [sweepstakesWinners.winnerMemberId],
      references: [members.id],
    }),
    grandWinnerMember: one(members, {
      fields: [sweepstakesWinners.grandWinnerMemberId],
      references: [members.id],
    }),
    selectedByUser: one(users, {
      fields: [sweepstakesWinners.selectedByUserId],
      references: [users.id],
    }),
  }),
);
