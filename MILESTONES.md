# Local City Places - Implementation Milestones

## Progress Tracker

| Milestone | Status | Commit |
|-----------|--------|--------|
| 1. Design System Shell | ✅ Complete | `8b64b50` |
| 2. Database & Auth | ✅ Complete | `32e5e50` |
| 2.5. Dark Mode | ✅ Complete | `50ccf9a` |
| 2.6. Admin Role Switching | ✅ Complete | `be52709` |
| 3. Member Registration Flow | ✅ Complete | - |
| 4. Member Dashboard | 🔲 Not Started | - |
| 5. Merchant Dashboard | 🔲 Not Started | - |
| 6. Admin Dashboard | 🔲 Not Started | - |
| 7. Email & Cron Jobs | 🔲 Not Started | - |

---

## Milestone 1: Design System Shell ✅

**Status:** Complete

**What was built:**
- CSS variables (success, warning, primary gradient)
- Layout components (DashboardLayout, Sidebar, MobileNav, Header)
- UI components (StatCard, ProgressBar, StatusBadge, PageHeader, EmptyState)
- Playwright E2E testing setup
- Best practices documented in PLAN.md

**Files created:**
- `src/components/layout/*` (6 files)
- `src/components/ui/stat-card.tsx`
- `src/components/ui/progress-bar.tsx`
- `src/components/ui/status-badge.tsx`
- `src/components/ui/page-header.tsx`
- `src/components/ui/empty-state.tsx`
- `playwright.config.ts`
- `e2e/home.spec.ts`

---

## Milestone 2: Database & Auth ✅

**Status:** Complete

**What was built:**
- Drizzle ORM schema with 16 tables
- Database connection to Neon PostgreSQL
- Magic link authentication flow
- Session management (httpOnly cookies, 7-day expiry)
- Route protection middleware
- Admin account for cartersteinhoff@gmail.com
- Starter categories seeded
- Basic admin dashboard page

**Files created:**
- `src/db/schema.ts` - All database tables
- `src/db/index.ts` - Database connection
- `src/db/seed.ts` - Seed script
- `src/lib/auth.ts` - Auth utilities
- `src/lib/email.ts` - Email service (placeholder)
- `src/middleware.ts` - Route protection
- `src/app/api/auth/magic-link/route.ts`
- `src/app/api/auth/verify/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/admin/page.tsx`
- `drizzle.config.ts`

**How to test:**
1. `npm run dev`
2. Go to http://localhost:3000
3. Click "GRC Member Login"
4. Enter cartersteinhoff@gmail.com
5. Check network tab for token in response (dev mode)
6. Visit `/api/auth/verify?token=YOUR_TOKEN`
7. Redirected to `/admin`

---

## Milestone 2.6: Admin Role Switching ✅

**Status:** Complete

**What was built:**
- Role switcher dropdown in header (Admin only)
- Admins can switch between Admin/Merchant/Member views
- Member dashboard page (`/member`) - allows admins
- Merchant dashboard page (`/merchant`) - allows admins
- Both dashboards show appropriate nav items and stats

**Files created/modified:**
- `src/components/ui/dropdown-menu.tsx` - shadcn component
- `src/components/layout/header.tsx` - Role switcher dropdown
- `src/components/layout/types.ts` - Added userRole prop
- `src/components/layout/dashboard-layout.tsx` - Pass userRole to header
- `src/app/member/page.tsx` - Member dashboard (admins allowed)
- `src/app/merchant/page.tsx` - Merchant dashboard (admins allowed)
- `src/app/admin/page.tsx` - Added userRole prop

---

## Milestone 3: Member Registration Flow ✅

**Status:** Complete

**What was built:**
- `/claim/[grcId]` - GRC claim entry point with auth detection
- `/member/register` - 6-step registration wizard:
  1. Confirm Email (shows logged-in email)
  2. Personal Info (name, address, city, state, zip)
  3. Grocery Store (Google Places autocomplete)
  4. Survey (merchant's survey questions, if any)
  5. Review Offer (50 words min for +1 month bonus)
  6. Start Date Selection (this month or next)
- `/member/grc-onboarding/[grcId]` - Returning member flow (3 steps: store, survey, start date)
- Google Places autocomplete component with US grocery store filtering
- Survey component (text, single choice, multiple choice)
- Form validation with Zod
- Wizard progress indicator (mobile + desktop views)

**Files created:**
- `src/app/claim/[grcId]/page.tsx`
- `src/app/member/register/page.tsx`
- `src/app/member/grc-onboarding/[grcId]/page.tsx`
- `src/app/api/grc/[grcId]/route.ts`
- `src/app/api/member/register/route.ts`
- `src/app/api/member/register-grc/route.ts`
- `src/app/api/survey/respond/route.ts`
- `src/app/api/review/create/route.ts`
- `src/components/registration/wizard-container.tsx`
- `src/components/registration/wizard-progress.tsx`
- `src/components/registration/steps/confirm-email-step.tsx`
- `src/components/registration/steps/personal-info-step.tsx`
- `src/components/registration/steps/grocery-store-step.tsx`
- `src/components/registration/steps/survey-step.tsx`
- `src/components/registration/steps/review-offer-step.tsx`
- `src/components/registration/steps/start-date-step.tsx`
- `src/components/ui/google-places-autocomplete.tsx`
- `src/lib/validations/member.ts`

**How to test:**
1. Create a test GRC in the database (requires merchant)
2. Visit `/claim/[grcId]`
3. Enter email and complete magic link flow
4. Complete the 6-step registration wizard
5. Verify redirect to `/member` dashboard

---

## Milestone 4: Member Dashboard 🔲

**Status:** Not Started

**What to build:**
- `/member` - Dashboard home with monthly progress
- `/member/upload` - Receipt upload with camera capture
- `/member/survey` - Monthly survey
- `/member/receipts` - Receipt history
- `/member/profile` - Edit profile
- Veryfi OCR integration for receipt processing
- Monthly qualification tracking
- Receipt status display (pending, approved, rejected)

**API routes needed:**
- `GET /api/member/dashboard` - Dashboard stats
- `POST /api/member/receipts/upload` - Upload receipt
- `GET /api/member/receipts` - List receipts
- `GET /api/member/qualification/current` - Current month status
- `POST /api/member/survey/submit` - Submit monthly survey

---

## Milestone 5: Merchant Dashboard 🔲

**Status:** Not Started

**What to build:**
- `/merchant` - Dashboard home
- `/merchant/purchase` - GRC purchase/checkout flow
- `/merchant/grcs` - View issued GRCs
- `/merchant/surveys` - Survey management
- `/merchant/reviews` - View member reviews
- `/merchant/settings` - Bank account, business info
- Bank account collection form (encrypted storage)
- Payment flow (Zelle or bank account)

**API routes needed:**
- `GET /api/merchant/dashboard` - Dashboard stats
- `POST /api/merchant/grcs/purchase` - Purchase GRCs
- `GET /api/merchant/grcs` - List issued GRCs
- `POST /api/merchant/surveys` - Create/update survey
- `GET /api/merchant/reviews` - List reviews
- `POST /api/merchant/bank-account` - Save bank info

---

## Milestone 6: Admin Dashboard 🔲

**Status:** Not Started

**What to build:**
- `/admin/moderation` - Receipt approval queue
- `/admin/gift-cards` - Gift card fulfillment
- `/admin/users` - User management
- `/admin/categories` - Category management
- `/admin/analytics` - Platform analytics
- Receipt moderation interface
- Batch gift card export/fulfillment
- Payment confirmation for Zelle orders

**API routes needed:**
- `GET /api/admin/receipts/pending` - Pending receipts
- `POST /api/admin/receipts/[id]/approve` - Approve receipt
- `POST /api/admin/receipts/[id]/reject` - Reject receipt
- `GET /api/admin/gift-cards/pending` - Pending fulfillment
- `POST /api/admin/gift-cards/mark-sent` - Mark batch sent
- `GET /api/admin/users` - List users
- `POST /api/admin/payments/confirm` - Confirm Zelle payment

---

## Milestone 7: Email & Cron Jobs 🔲

**Status:** Not Started

**What to build:**
- Postmark integration
- Email templates:
  - Welcome email
  - Magic link
  - GRC received
  - Mid-month reminder (15th)
  - End-month reminder (25th)
  - Receipt approved/rejected
  - Monthly qualification success/failure
  - GRC completion
- Vercel Cron jobs:
  - 15th/25th reminders (9am Phoenix)
  - Month rollover (1st @ 12:01am Phoenix)
  - GRC expiry check (daily @ 6am)
  - Merchant digest (weekly Monday)

**Files to create:**
- `src/lib/email-templates/*`
- `src/app/api/cron/reminders/route.ts`
- `src/app/api/cron/month-rollover/route.ts`
- `src/app/api/cron/expiry-check/route.ts`
- `vercel.json` (cron config)

---

## Commands Reference

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run Playwright tests

# Database
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed admin + categories

# Code Quality
npm run lint         # Run Biome linter
npm run format       # Format with Biome
```

---

## Environment Variables

Required in `.env.local`:
```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Future (not yet implemented):
```
POSTMARK_API_KEY=...
VERYFI_CLIENT_ID=...
VERYFI_API_KEY=...
GOOGLE_PLACES_API_KEY=...
ENCRYPTION_KEY=...
CRON_SECRET=...
```
