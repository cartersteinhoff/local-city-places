# Email Marketing System Implementation Plan

## Overview

Adapt the email marketing system from `local-city-places-old` to the current system, enabling admins to create and send broadcast email campaigns to different user segments.

## Key Differences Between Systems

| Aspect | Old System | Current System | Adaptation Needed |
|--------|-----------|----------------|-------------------|
| Database | Supabase | Drizzle ORM + PostgreSQL | Create new Drizzle schema tables |
| User Model | Single `users` table with `role` column | `users` + `members` tables | Adjust recipient queries |
| Roles | member, business_owner, admin, foodie_hosts | member, merchant, admin | Map recipient types |
| Email Provider | Postmark | Postmark | Reuse, already configured |
| Templates | Complex base-template.ts | Inline in email.ts | Create base template matching current style |

---

## Phase 1: Database Schema

### New Tables to Add (in `src/db/schema.ts`)

```typescript
// Email campaigns table
export const emailCampaigns = pgTable("email_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: varchar("subject", { length: 255 }).notNull(),
  previewText: varchar("preview_text", { length: 255 }),
  content: text("content").notNull(), // TipTap JSON or HTML
  recipientType: varchar("recipient_type", { length: 50 }).notNull(), // 'all', 'members', 'merchants', 'admins', 'custom', 'individual'
  recipientLists: jsonb("recipient_lists").$type<string[]>(), // For multi-select lists
  recipientCount: integer("recipient_count").notNull().default(0),
  individualRecipientId: uuid("individual_recipient_id").references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, sending, sent, failed
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
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
export const campaignRecipients = pgTable("campaign_recipients", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().references(() => emailCampaigns.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id),
  email: varchar("email", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, sent, failed, bounced
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  bouncedAt: timestamp("bounced_at"),
  postmarkMessageId: varchar("postmark_message_id", { length: 100 }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("campaign_recipient_unique_idx").on(table.campaignId, table.userId),
]);

// Email logs table (for transactional email history)
export const emailLogs = pgTable("email_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  emailType: varchar("email_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(), // sent, failed
  postmarkId: varchar("postmark_id", { length: 100 }),
  subject: varchar("subject", { length: 255 }),
  htmlContent: text("html_content"),
  recipientEmail: varchar("recipient_email", { length: 255 }),
  error: text("error"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

// Email preferences table (for unsubscribe management)
export const emailPreferences = pgTable("email_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id).unique(),
  unsubscribedAll: boolean("unsubscribed_all").default(false),
  marketingEmails: boolean("marketing_emails").default(true),
  transactionalEmails: boolean("transactional_emails").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

## Phase 2: Base Email Template

### Create `src/lib/email/base-template.ts`

Use the current system's design style (from `src/lib/email.ts`) but make it reusable:

- Keep the current header with logo
- Maintain dark blue gradient wrapper
- White content area with clean typography
- Footer with support email and legal text
- Add unsubscribe link support for marketing emails

Key features to include:
- `wrapInBaseTemplate(content, options)` function
- Configurable preheader text
- Optional unsubscribe link
- Helper functions: `createAlertBox()`, `createDetailList()`, `createButton()`

---

## Phase 3: Email Infrastructure

### 3.1 Create `src/lib/email/postmark-broadcast.ts`

Port the broadcast email functionality:
- Batch sending (500 recipients per batch - Postmark limit)
- Personalization with merge tags: `{{firstName}}`, `{{name}}`, `{{email}}`
- Custom unsubscribe links per recipient
- Campaign tagging for Postmark tracking
- Return success/failure counts with message IDs

### 3.2 Create `src/lib/email/postmark-stats.ts`

Sync campaign stats from Postmark:
- Fetch open/click/bounce events by campaign tag
- Update `emailCampaigns` stats columns
- Update individual `campaignRecipients` records

### 3.3 Update `src/lib/email.ts`

Refactor existing functions to use the new base template:
- `sendMagicLinkEmail()` - wrap with base template
- `sendWelcomeEmail()` - wrap with base template
- `sendGrcIssuedEmail()` - wrap with base template
- Add email logging to all sends

---

## Phase 4: Admin UI

### 4.1 Create Admin Email Section

**Navigation:** Add to `/src/app/admin/nav.ts`

```typescript
{ name: "Email Campaigns", href: "/admin/emails", icon: Mail }
```

### 4.2 Campaign List Page (`/admin/emails/page.tsx`)

Features:
- Table showing all campaigns with stats
- Filter by status (draft, sent, all)
- Search by subject
- Pagination
- Link to compose new campaign
- Link to view campaign details

### 4.3 Compose Page (`/admin/emails/compose/page.tsx`)

Features:
- Subject line input
- Preview text input
- Rich text editor (TipTap) for content
- Recipient selection:
  - Checkboxes for lists: Members, Merchants, Admins
  - OR individual user search
- Live recipient count
- Save as draft button
- Send test email button
- Send campaign button with confirmation

### 4.4 Campaign Detail Page (`/admin/emails/[id]/page.tsx`)

Features:
- Campaign stats cards (sent, opened, clicked, bounced)
- Open rate and click rate percentages
- Recipients list with engagement status
- Email preview
- Sync stats from Postmark button

### 4.5 Email Templates Page (`/admin/emails/templates/page.tsx`)

Features:
- List all transactional email templates
- Preview each template
- Send test email for each template
- Categorized by type (auth, GRC, etc.)

---

## Phase 5: API Routes

### 5.1 Campaign Actions (`/admin/emails/actions.ts`)

Server actions:
- `getCampaigns()` - List with pagination/filters
- `getCampaign(id)` - Single campaign with stats
- `createCampaign(formData)` - Create draft
- `updateCampaign(id, formData)` - Update draft
- `sendCampaign(id)` - Send to all recipients
- `sendTestEmail(data)` - Send test to admin
- `syncCampaignStats(id)` - Fetch stats from Postmark
- `deleteCampaign(id)` - Delete draft only
- `getRecipientCount(lists)` - Count for selected lists

### 5.2 Image Upload (`/api/admin/emails/upload-image/route.ts`)

- Accept image upload from TipTap editor
- Store in Vercel Blob
- Return absolute URL

### 5.3 Test Email (`/api/admin/send-test-email/route.ts`)

- Send any template to a test email
- Used by templates preview page

---

## Phase 6: Unsubscribe System

### 6.1 Unsubscribe Page (`/unsubscribe/page.tsx`)

- Accept signed token in URL
- Show confirmation message
- Allow re-subscribe option

### 6.2 Unsubscribe API (`/api/unsubscribe/route.ts`)

- Validate token
- Update `emailPreferences` table
- Return success/error

### 6.3 Generate Unsubscribe Links

- Create signed links with user ID and expiry
- Include in all marketing emails

---

## Phase 7: TipTap Editor Integration

### 7.1 Create/Port TipTap Component

If not already in codebase:
- Rich text editor with formatting
- Image upload/paste support
- Deferred upload (base64 in editor, upload on save)
- Convert JSON to HTML for emails

### 7.2 HTML Conversion

- `convertTipTapJsonToHtml()` function
- Handle images, links, formatting

---

## Implementation Order

1. **Database schema** - Add tables, run migration
2. **Base template** - Create reusable template system
3. **Broadcast infrastructure** - Postmark batch sending
4. **Admin list page** - View campaigns
5. **Compose page** - Create campaigns (basic)
6. **Send functionality** - Actually send emails
7. **Campaign detail page** - View results
8. **Stats sync** - Postmark integration
9. **Unsubscribe system** - Compliance
10. **Templates preview** - Admin testing tool
11. **TipTap editor** - Rich editing (if not present)

---

## Recipient Lists Mapping

| Old System | Current System | Query |
|------------|----------------|-------|
| members | members | `users.role = 'member'` |
| business_owners | merchants | `users.role = 'merchant'` |
| admins | admins | `users.role = 'admin'` |
| foodie_hosts | (n/a) | Not applicable |
| all | all | All users with email |
| individual | individual | Specific user by ID |

---

## Environment Variables Needed

Already in `.env`:
- `POSTMARK_API_KEY`
- `POSTMARK_FROM_EMAIL`
- `POSTMARK_FROM_NAME`

May need to add:
- `POSTMARK_BROADCAST_STREAM` (for broadcast message stream)
- `UNSUBSCRIBE_SECRET` (for signing unsubscribe links)

---

## Files to Create

```
src/
├── db/
│   └── schema.ts (add new tables)
├── lib/
│   └── email/
│       ├── base-template.ts (NEW)
│       ├── postmark-broadcast.ts (NEW)
│       ├── postmark-stats.ts (NEW)
│       └── tiptap-json-to-html.ts (NEW)
├── app/
│   ├── admin/
│   │   ├── nav.ts (add email nav item)
│   │   └── emails/
│   │       ├── page.tsx (campaign list)
│   │       ├── actions.ts (server actions)
│   │       ├── email-campaign-table.tsx
│   │       ├── compose/
│   │       │   ├── page.tsx
│   │       │   ├── email-compose-form.tsx
│   │       │   └── email-preview.tsx
│   │       ├── [id]/
│   │       │   ├── page.tsx
│   │       │   └── campaign-recipients-list.tsx
│   │       └── templates/
│   │           ├── page.tsx
│   │           └── email-preview-client.tsx
│   ├── api/
│   │   └── admin/
│   │       └── emails/
│   │           └── upload-image/
│   │               └── route.ts
│   └── unsubscribe/
│       ├── page.tsx
│       └── actions.ts
└── components/
    └── tiptap-editor-deferred-upload.tsx (if needed)
```

---

## Estimated Complexity

- **Low**: Database schema, base template, nav update
- **Medium**: Campaign list, compose form, API routes
- **High**: TipTap editor, broadcast sending, stats sync

---

## Notes

- The current system already uses Postmark, so email delivery infrastructure is ready
- Keep the current email design style (logo header, dark gradient wrapper, white content)
- Focus on admin-only access - no public email management needed
- Recipient lists are simpler in current system (3 roles vs 5+)
- Consider batch limits when sending to large lists
