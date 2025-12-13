import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uuid,
  varchar,
  decimal,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["member", "merchant", "admin"]);
export const grcStatusEnum = pgEnum("grc_status", ["pending", "active", "completed", "expired"]);
export const receiptStatusEnum = pgEnum("receipt_status", ["pending", "approved", "rejected"]);
export const qualificationStatusEnum = pgEnum("qualification_status", [
  "in_progress",
  "receipts_complete",
  "qualified",
  "pending_review",
  "forfeited",
]);
export const paymentMethodEnum = pgEnum("payment_method", ["bank_account", "zelle", "business_check"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "confirmed", "failed"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  role: userRoleEnum("role").notNull().default("member"),
  profilePhotoUrl: text("profile_photo_url"),
  notificationPrefs: jsonb("notification_prefs").$type<{
    emailReceipts?: boolean;
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
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  address: varchar("address", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zip: varchar("zip", { length: 20 }),
  homeCity: varchar("home_city", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Categories table
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Merchants table
export const merchants = pgTable("merchants", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }), // 2-letter state code (e.g., "CO", "CA")
  logoUrl: text("logo_url"),
  description: text("description"),
  phone: varchar("phone", { length: 20 }),
  website: varchar("website", { length: 255 }),
  googlePlaceId: varchar("google_place_id", { length: 255 }), // For Google Places integration
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

// Surveys table
export const surveys = pgTable("surveys", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  questions: jsonb("questions").notNull(), // Array of question objects
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// GRCs table - ISSUED certificates only
// A GRC record is created ONLY when a merchant issues it to a customer.
// Do NOT pre-create GRC records for inventory - that's tracked in grcPurchases.
// See CLAUDE.md "GRC Data Model" for full explanation.
export const grcs = pgTable("grcs", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  memberId: uuid("member_id").references(() => members.id, { onDelete: "set null" }),
  denomination: integer("denomination").notNull(), // $50-$500
  costPerCert: decimal("cost_per_cert", { precision: 5, scale: 2 }).notNull(),
  groceryStore: varchar("grocery_store", { length: 255 }),
  groceryStorePlaceId: varchar("grocery_store_place_id", { length: 255 }),
  status: grcStatusEnum("status").notNull().default("pending"),
  monthsRemaining: integer("months_remaining").notNull(),
  startMonth: integer("start_month"), // 1-12
  startYear: integer("start_year"),
  issuedAt: timestamp("issued_at"),
  registeredAt: timestamp("registered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Member GRC queue - tracks preferred order for pending GRCs
export const memberGrcQueue = pgTable("member_grc_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  grcId: uuid("grc_id")
    .notNull()
    .references(() => grcs.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("member_grc_queue_unique_idx").on(table.memberId, table.grcId),
]);

// GRC purchases table - INVENTORY tracking
// This tracks what merchants have purchased (their issuable inventory).
// Inventory = sum(quantity where paymentStatus='confirmed') - count(grcs for this merchant)
// When admin approves, only update paymentStatus - do NOT create grcs records.
export const grcPurchases = pgTable("grc_purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  denomination: integer("denomination").notNull(),
  quantity: integer("quantity").notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  isTrial: boolean("is_trial").default(false).notNull(), // True for free trial GRCs
  // Zelle payment info
  zelleAccountName: varchar("zelle_account_name", { length: 255 }), // Name on bank sending Zelle
  // Admin fields
  paymentNotes: text("payment_notes"),
  rejectionReason: varchar("rejection_reason", { length: 255 }),
  paymentConfirmedAt: timestamp("payment_confirmed_at"),
  paymentConfirmedBy: uuid("payment_confirmed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Receipts table
export const receipts = pgTable("receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  grcId: uuid("grc_id")
    .notNull()
    .references(() => grcs.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  imageHash: varchar("image_hash", { length: 64 }), // SHA-256 hash for duplicate detection
  amount: decimal("amount", { precision: 10, scale: 2 }),
  receiptDate: timestamp("receipt_date"),
  extractedStoreName: varchar("extracted_store_name", { length: 255 }),
  storeMismatch: boolean("store_mismatch").default(false),
  dateMismatch: boolean("date_mismatch").default(false),
  memberOverride: boolean("member_override").default(false),
  veryfiResponse: jsonb("veryfi_response"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  status: receiptStatusEnum("status").notNull().default("pending"),
  rejectionReason: varchar("rejection_reason", { length: 100 }),
  rejectionNotes: text("rejection_notes"),
  reuploadAllowedUntil: timestamp("reupload_allowed_until"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
});

// Monthly qualifications table
export const monthlyQualifications = pgTable("monthly_qualifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  grcId: uuid("grc_id")
    .notNull()
    .references(() => grcs.id, { onDelete: "cascade" }),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  approvedTotal: decimal("approved_total", { precision: 10, scale: 2 }).default("0"),
  surveyCompletedAt: timestamp("survey_completed_at"),
  status: qualificationStatusEnum("status").notNull().default("in_progress"),
  rewardSentAt: timestamp("reward_sent_at"),
  giftCardTrackingNumber: varchar("gift_card_tracking_number", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Survey responses table
export const surveyResponses = pgTable("survey_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  surveyId: uuid("survey_id")
    .notNull()
    .references(() => surveys.id, { onDelete: "cascade" }),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  month: integer("month"), // null for registration survey
  year: integer("year"), // null for registration survey
  answers: jsonb("answers").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  wordCount: integer("word_count").notNull(),
  bonusMonthAwarded: boolean("bonus_month_awarded").default(false),
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
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sessions table (for auth)
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Skipped receipts table - tracks Veryfi documents that were analyzed but not submitted
// Used to handle "retry" scenarios where user uploads same receipt again
// When duplicate detected, check if duplicate_of matches a skipped receipt for same member
export const skippedReceipts = pgTable("skipped_receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  grcId: uuid("grc_id")
    .notNull()
    .references(() => grcs.id, { onDelete: "cascade" }),
  veryfiDocumentId: integer("veryfi_document_id").notNull(),
  imageUrl: text("image_url").notNull(), // Blob URL for cleanup
  // Cached Veryfi analysis results
  amount: decimal("amount", { precision: 10, scale: 2 }),
  receiptDate: timestamp("receipt_date"),
  extractedStoreName: varchar("extracted_store_name", { length: 255 }),
  storeMismatch: boolean("store_mismatch").default(false),
  dateMismatch: boolean("date_mismatch").default(false),
  veryfiResponse: jsonb("veryfi_response"),
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
  sessions: many(sessions),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
  grcs: many(grcs),
  receipts: many(receipts),
  monthlyQualifications: many(monthlyQualifications),
  surveyResponses: many(surveyResponses),
  reviews: many(reviews),
  offerClaims: many(offerClaims),
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
  grcs: many(grcs),
  grcPurchases: many(grcPurchases),
  surveys: many(surveys),
  reviews: many(reviews),
  marketplaceOffers: many(marketplaceOffers),
}));

export const grcsRelations = relations(grcs, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [grcs.merchantId],
    references: [merchants.id],
  }),
  member: one(members, {
    fields: [grcs.memberId],
    references: [members.id],
  }),
  receipts: many(receipts),
  monthlyQualifications: many(monthlyQualifications),
}));

export const receiptsRelations = relations(receipts, ({ one }) => ({
  member: one(members, {
    fields: [receipts.memberId],
    references: [members.id],
  }),
  grc: one(grcs, {
    fields: [receipts.grcId],
    references: [grcs.id],
  }),
  reviewedByUser: one(users, {
    fields: [receipts.reviewedBy],
    references: [users.id],
  }),
}));

export const surveysRelations = relations(surveys, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [surveys.merchantId],
    references: [merchants.id],
  }),
  responses: many(surveyResponses),
}));

export const surveyResponsesRelations = relations(surveyResponses, ({ one }) => ({
  survey: one(surveys, {
    fields: [surveyResponses.surveyId],
    references: [surveys.id],
  }),
  member: one(members, {
    fields: [surveyResponses.memberId],
    references: [members.id],
  }),
}));

export const monthlyQualificationsRelations = relations(monthlyQualifications, ({ one }) => ({
  member: one(members, {
    fields: [monthlyQualifications.memberId],
    references: [members.id],
  }),
  grc: one(grcs, {
    fields: [monthlyQualifications.grcId],
    references: [grcs.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const merchantInvitesRelations = relations(merchantInvites, ({ one }) => ({
  createdByUser: one(users, {
    fields: [merchantInvites.createdBy],
    references: [users.id],
  }),
  usedByUser: one(users, {
    fields: [merchantInvites.usedByUserId],
    references: [users.id],
  }),
}));
