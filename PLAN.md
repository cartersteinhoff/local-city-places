# Local City Places - GRC Platform Implementation Plan

## Overview

This plan covers the GRC (Grocery Rebate Certificate) platform including:
- GRC Landing Page (`/grc`)
- Member Dashboard
- Merchant Dashboard (future)
- Admin Dashboard (future)

**Strategy:** Build shared foundation first, then dashboard-specific features can be parallelized.

---

## Part 1: Shared Foundation (Build First)

### 1.1 Database Schema (Drizzle ORM)

**File:** `src/db/schema.ts`

```
Tables:
- users (id, email, phone, role: 'member'|'merchant'|'admin', createdAt, updatedAt)
- members (id, userId, firstName, lastName, address, city, state, zip, homeCity, status, createdAt)
- categories (id, name, createdAt) -- Admin-managed, starter list + custom
- merchants (id, userId, businessName, categoryId (optional), city, verified, createdAt)
- merchant_bank_accounts (id, merchantId, routingNumber_encrypted, accountNumber_encrypted, accountType, accountHolderName, createdAt)
- grcs (id, merchantId, memberId, denomination, costPerCert, groceryStore, groceryStorePlaceId, status: 'pending'|'active'|'completed'|'expired', monthsRemaining, issuedAt, createdAt)
- grc_purchases (id, merchantId, denomination, quantity, totalCost, paymentMethod: 'bank_account'|'zelle', paymentStatus: 'pending'|'confirmed'|'failed', paymentConfirmedAt, paymentConfirmedBy, createdAt)
- receipts (id, memberId, grcId, imageUrl, imageHash, amount, receiptDate, extractedStoreName, storeMismatch, veryfiResponse: jsonb, submittedAt, status: 'pending'|'approved'|'rejected', rejectionReason, rejectionNotes, reuploadAllowedUntil, reviewedAt, reviewedBy)
- monthly_qualifications (id, memberId, grcId, month, year, approvedTotal, surveyCompletedAt, status: 'in_progress'|'receipts_complete'|'qualified'|'pending_review'|'forfeited', rewardSentAt, giftCardTrackingNumber)
- surveys (id, merchantId, title, questions: jsonb, isActive)
- survey_responses (id, surveyId, memberId, month, year, answers: jsonb, createdAt)
- reviews (id, merchantId, memberId, content, wordCount, bonusMonthAwarded, createdAt)
- marketplace_offers (id, merchantId, title, description, isActive, createdAt)
- offer_claims (id, offerId, memberId, claimedAt)

Starter categories: Auto, Dining, Beauty, Fitness, Retail, Home Services, Health, Entertainment
```

**File:** `src/db/index.ts` - Database connection client

### 1.2 Authentication System

**Magic Link Flow:**
1. User enters email → `POST /api/auth/magic-link`
2. Email sent with token link
3. User clicks link → `GET /api/auth/verify?token=xxx`
4. Session created, redirect to appropriate dashboard

**Files:**
- `src/app/api/auth/magic-link/route.ts`
- `src/app/api/auth/verify/route.ts`
- `src/lib/auth.ts` - Session management utilities
- `src/middleware.ts` - Route protection

**Session Strategy:** JWT stored in httpOnly cookie

### 1.3 Shared UI Components

**Files to create in `src/components/`:**
- `dashboard-layout.tsx` - Sidebar + main content wrapper
- `dashboard-nav.tsx` - Navigation component
- `stat-card.tsx` - Dashboard metric cards
- `progress-bar.tsx` - Visual progress indicator
- `file-upload.tsx` - Receipt photo upload component
- `google-places-autocomplete.tsx` - Grocery store selector

### 1.4 Email Service Setup

**File:** `src/lib/email.ts`

Email templates needed:
- Welcome email (after registration)
- Magic link email
- GRC received notification
- Mid-month reminder (15th) - shows current progress + amount needed to reach $100
- End-of-month reminder (25th) - shows current progress + amount needed to reach $100
- Receipt approved/rejected notification
- Monthly qualification success - "You qualified! Gift card coming by [date]"
- Monthly qualification failed - "You didn't reach $100 this month"
- GRC completion email - summary + next GRC activated (if any)
- Rebate reward sent notification

**Reminder Email Content:**
```
Subject: You're $[amount] away from your $25 rebate!

Hi [Name],

Here's your December progress:
✓ Approved: $[approved]
⏳ Pending: $[pending]
─────────────
📊 Total: $[total] / $100

You need $[remaining] more to qualify this month.

[Upload Receipt Button]

Reminder: Submit by December 31st (Phoenix time).
```

### 1.5 Support & Help

**Support Options:**
1. **Email:** support@localcityplaces.com
2. **Contact Form:** `/support` - sends to support email
3. **Live Chat:** Crisp integration (widget on all pages)
4. **Help Center:** `/help` - FAQ page with common questions

**Crisp Integration:**
- Add Crisp widget script to layout
- Configure in Crisp dashboard
- Shows on member dashboard, registration, etc.

**Help Center Topics:**
- How do GRCs work?
- How to upload receipts
- Why was my receipt rejected?
- How to change my grocery store
- When will I receive my gift card?
- Contact support

### 1.6 Scheduled Tasks (Vercel Cron)

**File:** `vercel.json` + `src/app/api/cron/*`

| Schedule | Task | Description |
|----------|------|-------------|
| 15th @ 9am Phoenix | Mid-month reminder | Email members with progress + amount needed |
| 25th @ 9am Phoenix | End-of-month reminder | Final reminder email before month ends |
| 1st @ 12:01am Phoenix | Month rollover | Mark previous month as qualified/forfeited, create new month records |
| Daily @ 6am | GRC expiry check | Expire GRCs not registered within 30 days |
| Daily @ 6am | Grace period check | Forfeit months where grace period expired |

**Cron API Routes:**
- `POST /api/cron/send-reminders` - triggered on 15th and 25th
- `POST /api/cron/month-rollover` - triggered on 1st
- `POST /api/cron/expire-grcs` - daily check
- `POST /api/cron/check-grace-periods` - daily check

**Security:** Verify `CRON_SECRET` header matches env var

---

## Design System

### Philosophy
- Mobile-first responsive design (phone → tablet → desktop)
- Consistent across Member, Merchant, and Admin dashboards
- Orange gradient accent from GRC landing page as primary brand element
- Clean, modern SaaS patterns with friendly touches

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#ff7a3c` | Primary buttons, active states |
| `--primary-gradient` | `linear-gradient(135deg, #ff7a3c, #ff9f1c)` | CTAs, highlights |
| `--background` | `#f7fafc` | Page backgrounds |
| `--card` | `#ffffff` | Card backgrounds |
| `--text-primary` | `#1a202c` | Headings, primary text |
| `--text-secondary` | `#4a5568` | Secondary text, labels |
| `--border` | `#e2e8f0` | Borders, dividers |
| `--success` | `#48bb78` | Success states, approved |
| `--warning` | `#ecc94b` | Warnings, pending |
| `--error` | `#f56565` | Errors, rejected |

### Typography
- **Font Family:** System UI stack (already configured)
- **Headings:** Font-weight 700-800, tight letter-spacing
- **Body:** 14-16px, normal weight
- **Labels/Captions:** 12-13px, uppercase for status badges

### Breakpoints
| Name | Width | Target |
|------|-------|--------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets portrait |
| `lg` | 1024px | Tablets landscape, small laptops |
| `xl` | 1280px | Desktops |

### Layout Structure (All Dashboards)

**Mobile (< 768px):**
```
┌─────────────────────────┐
│ Header: Logo + Hamburger│
├─────────────────────────┤
│                         │
│      Main Content       │
│      (full width)       │
│                         │
├─────────────────────────┤
│ Bottom Nav (4-5 icons)  │
└─────────────────────────┘
```

**Tablet/Desktop (≥ 768px):**
```
┌──────┬──────────────────┐
│      │ Header: Search,  │
│ Side │ Profile, Logout  │
│ bar  ├──────────────────┤
│      │                  │
│ Nav  │   Main Content   │
│      │                  │
│      │                  │
└──────┴──────────────────┘
```

### Sidebar Navigation
- Collapsible on tablet (icon-only mode)
- Always visible on desktop
- Becomes bottom nav on mobile

**Member Nav Items:**
- Dashboard (home)
- Upload Receipt
- Survey
- Marketplace
- Profile

**Merchant Nav Items:**
- Dashboard
- Issue GRC
- My GRCs
- Surveys
- Reviews
- Settings

**Admin Nav Items:**
- Dashboard
- Moderation
- Gift Cards
- Users
- Categories
- Analytics

### Component Patterns

**Cards:**
- White background, subtle shadow
- Rounded corners (12-16px)
- Padding: 16px mobile, 24px desktop

**Stat Cards:**
- Large number, small label
- Optional trend indicator
- Icon or color accent

**Tables (Desktop):**
- Horizontal scroll on mobile
- Or convert to card list on mobile

**Forms:**
- Single column on mobile
- Two columns on desktop where appropriate
- Floating labels or top-aligned labels

**Buttons:**
- Primary: Orange gradient, white text
- Secondary: White with border
- Ghost: Transparent with text color
- Full-width on mobile, auto-width on desktop

**Progress Indicators:**
- Horizontal progress bar for monthly goal
- Circular progress for completion percentage
- Step indicators for multi-step flows

### Mobile-Specific Patterns

**Bottom Sheet:**
- Use for filters, actions, confirmations on mobile
- Slide up from bottom

**Pull to Refresh:**
- On dashboard and list views

**Swipe Actions:**
- On receipt list items (view details)

**Touch Targets:**
- Minimum 44x44px tap targets
- Adequate spacing between interactive elements

**Receipt Upload:**
- Camera capture option (not just file picker)
- Full-screen preview before submit

### Design System Implementation

**1. CSS Variables (`src/app/globals.css`)**
```css
:root {
  /* Brand Colors */
  --primary: #ff7a3c;
  --primary-hover: #e86a2c;
  --primary-gradient: linear-gradient(135deg, #ff7a3c, #ff9f1c);

  /* Semantic Colors */
  --success: #48bb78;
  --warning: #ecc94b;
  --error: #f56565;

  /* Neutrals */
  --background: #f7fafc;
  --card: #ffffff;
  --border: #e2e8f0;
  --text-primary: #1a202c;
  --text-secondary: #4a5568;
  --text-muted: #a0aec0;
}
```

**2. Tailwind Config Extension (`tailwind.config.ts`)**
```ts
// Extend theme with CSS variables
theme: {
  extend: {
    colors: {
      primary: 'var(--primary)',
      success: 'var(--success)',
      warning: 'var(--warning)',
      error: 'var(--error)',
    },
    backgroundImage: {
      'primary-gradient': 'var(--primary-gradient)',
    },
  },
}
```

**3. Component Files to Create**

| File | Description |
|------|-------------|
| `src/components/layout/dashboard-layout.tsx` | Main layout wrapper with responsive sidebar/bottom nav |
| `src/components/layout/sidebar.tsx` | Desktop/tablet sidebar navigation |
| `src/components/layout/mobile-nav.tsx` | Bottom navigation for mobile |
| `src/components/layout/header.tsx` | Top header with profile/actions |
| `src/components/ui/stat-card.tsx` | Dashboard stat display card |
| `src/components/ui/progress-bar.tsx` | Horizontal progress indicator |
| `src/components/ui/status-badge.tsx` | Colored status indicators |
| `src/components/ui/data-table.tsx` | Responsive table (cards on mobile) |
| `src/components/ui/bottom-sheet.tsx` | Mobile slide-up sheet |
| `src/components/ui/empty-state.tsx` | Empty list/no data display |
| `src/components/ui/page-header.tsx` | Page title + actions |

**4. Layout Usage Pattern**
```tsx
// src/app/member/layout.tsx
export default function MemberLayout({ children }) {
  return (
    <DashboardLayout
      role="member"
      navItems={memberNavItems}
    >
      {children}
    </DashboardLayout>
  )
}

// src/app/merchant/layout.tsx
export default function MerchantLayout({ children }) {
  return (
    <DashboardLayout
      role="merchant"
      navItems={merchantNavItems}
    >
      {children}
    </DashboardLayout>
  )
}
```

**5. Mobile-First Component Example**
```tsx
// Responsive stat cards
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard title="This Month" value="$45" subtitle="of $100" />
  <StatCard title="GRC Balance" value="$100" subtitle="4 months left" />
</div>

// Table that becomes cards on mobile
<DataTable
  data={receipts}
  columns={columns}
  mobileCardRender={(row) => <ReceiptCard receipt={row} />}
/>
```

**6. Icon Library**
- Use `lucide-react` (already installed with shadcn)
- Consistent 24px size for nav, 20px for inline
- Stroke width 1.5-2

**7. Animation & Transitions**
- Use `tw-animate-css` for page transitions
- Subtle hover states (0.15s ease)
- Loading states (see best practices below)

### Best Practices

**Loading States (Skip Generic Skeletons)**
- **Build component-specific loading states**: Each component should have its own loading variant that mirrors its exact structure (same heights, widths, spacing, padding)
- **Use the same wrapper**: Loading state lives inside same parent so grid/flex positioning is identical
- **Match dimensions precisely**: If heading is 24px, skeleton bar is 24px. If image is 150x100, placeholder is 150x100
- **Colocate loading states**: Keep `StatCard` and `StatCardLoading` together or use a single component with `isLoading` prop
- **Example pattern:**
```tsx
export function StatCard({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="p-4 bg-card rounded-lg">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-8 w-16 bg-muted animate-pulse rounded mt-2" />
      </div>
    );
  }
  return (
    <div className="p-4 bg-card rounded-lg">
      <p className="text-sm text-muted-foreground">{data.label}</p>
      <p className="text-2xl font-bold">{data.value}</p>
    </div>
  );
}
```
- **Animate subtly**: Gentle pulse or shimmer, not distracting
- **Show loading immediately**: Prevent layout shift by showing skeleton before data arrives

**Accessibility (a11y)**
- All interactive elements keyboard accessible
- Focus states visible (not just hover)
- Color contrast minimum 4.5:1 for text
- Screen reader labels for icon-only buttons (`aria-label`)
- Form inputs have associated labels
- Error messages linked to inputs (`aria-describedby`)
- Skip to main content link
- Reduced motion support (`prefers-reduced-motion`)

**Performance**
- Lazy load images and heavy components
- Use Next.js `<Image>` for automatic optimization
- Code split by route (automatic with App Router)
- Prefetch critical routes on hover/viewport
- Minimize client-side JavaScript where possible
- Use Server Components by default, Client Components only when needed

**State Management**
- Server state: React Query or SWR for data fetching/caching
- Form state: React Hook Form with Zod validation
- UI state: Local useState, lift only when necessary
- Global state: React Context for auth/user, avoid overuse

**Error Handling**
- Error boundaries for graceful failures
- Toast notifications for actions (success/error)
- Inline validation on forms (real-time feedback)
- Friendly error pages (404, 500)
- Retry mechanisms for failed API calls

**Forms**
- Validate on blur, not just submit
- Show requirements upfront (password rules, etc.)
- Preserve input on errors
- Autofocus first field
- Smart defaults where possible
- Mobile: appropriate input types (`tel`, `email`, `inputmode="numeric"`)

**Navigation & Routing**
- Breadcrumbs for nested pages
- Active state on current nav item
- Preserve scroll position on back navigation
- Confirmation before leaving unsaved changes
- Deep linking support (shareable URLs)

**Data Display**
- Empty states with helpful actions
- Pagination or infinite scroll for long lists
- Search/filter persistence in URL
- Sort indicators on table headers
- Relative dates ("2 hours ago") with full date on hover

**Security (Frontend)**
- Sanitize user-generated content display
- CSRF tokens on forms (built into Next.js)
- Secure cookie flags
- No sensitive data in localStorage
- Rate limit indicators to users

**Testing Considerations**
- Components should be testable in isolation
- Data attributes for E2E selectors (`data-testid`)
- Consistent naming conventions

**Code Organization**
```
src/
├── app/                    # Routes (Next.js App Router)
│   ├── (auth)/            # Auth group (login, verify)
│   ├── (dashboard)/       # Dashboard group
│   │   ├── member/
│   │   ├── merchant/
│   │   └── admin/
│   ├── api/               # API routes
│   └── globals.css
├── components/
│   ├── layout/            # Layout components
│   ├── ui/                # Base UI components (shadcn)
│   ├── forms/             # Form-specific components
│   └── features/          # Feature-specific components
│       ├── receipts/
│       ├── surveys/
│       └── grcs/
├── lib/
│   ├── auth.ts            # Auth utilities
│   ├── db.ts              # Database client
│   ├── email.ts           # Email service
│   ├── utils.ts           # General utilities
│   └── validations/       # Zod schemas
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
└── constants/             # App constants
```

**Naming Conventions**
- Components: PascalCase (`StatCard.tsx`)
- Hooks: camelCase with `use` prefix (`useReceipts.ts`)
- Utils: camelCase (`formatCurrency.ts`)
- Types: PascalCase (`Receipt`, `GRC`)
- CSS variables: kebab-case (`--primary-color`)
- API routes: kebab-case (`/api/member/grcs`)
- Database columns: snake_case (`created_at`)

**Git Workflow**
- Feature branches from `main`
- PR reviews before merge
- Conventional commits (`feat:`, `fix:`, `chore:`)
- Squash merge to keep history clean

---

## Part 2: GRC Landing Page (`/grc`)

**File:** `src/app/grc/page.tsx`

### Design Specs (from troywarren.com/grclander.html)

**Color Palette:**
- Primary Orange: `#ff7a3c`
- Secondary Orange: `#ff9f1c`
- Accent Yellow: `#ffd166`
- Background: `#f7fafc`
- Text Main: `#1a202c`
- Text Soft: `#4a5568`

**Sections to build:**
1. Sticky header with nav
2. Hero section with stats pills
3. "How GRC Works" - 3 steps
4. "Why Merchants Love GRC" - 3 feature cards
5. Comparison table (Traditional vs GRC)
6. City Marketplace preview (4 merchant tiles)
7. CTA band with orange gradient
8. FAQ section (2-column)
9. Footer

### Interactive Pricing Slider

**Updated pricing (19 tiers):**
| GRC Value | Cost/Cert |
|-----------|-----------|
| $50 | $1.25 |
| $75 | $1.50 |
| $100 | $1.75 |
| $125 | $2.00 |
| $150 | $2.25 |
| $175 | $2.50 |
| $200 | $2.75 |
| $225 | $3.00 |
| $250 | $3.25 |
| $275 | $3.50 |
| $300 | $3.75 |
| $325 | $4.00 |
| $350 | $4.25 |
| $375 | $4.50 |
| $400 | $4.75 |
| $425 | $5.00 |
| $450 | $5.25 |
| $475 | $5.50 |
| $500 | $5.75 |

**Minimum purchase:** 50 certificates

**Slider component:** Select denomination, input quantity (min 50), shows total cost

### Video Placeholder
- Keep video section with placeholder
- User will add HeyGen video later

### Button Styling
- Use primary color (orange) as solid base
- Gradient for CTAs: `linear-gradient(135deg, #ff7a3c, #ff9f1c)`
- Or use existing primary color with gradient variant

---

## Part 3: Member Dashboard

### 3.1 GRC Claim Flow

**Route:** `/claim/[grcId]`

When member clicks link in GRC email:
1. Look up GRC by ID → get associated email
2. **If email exists as member** → Send magic link, after login go to GRC onboarding flow (survey only, personal info pre-filled)
3. **If email doesn't exist** → Start full registration flow (email pre-filled)

### 3.2 Registration Flow (New Members)

**Route:** `/member/register`

**Steps:**
1. **Confirm Email** - Pre-filled from GRC, member confirms
2. **Personal Info** - Phone, address (city/state becomes homeCity)
3. **Grocery Store Selection** - Google Places API autocomplete for grocery stores
4. **Survey** - Questions from the merchant who issued the GRC
5. **One-Time Review Offer** - 50 word min review for +1 bonus month (first registration only)
6. **Choose Start Date** - Start this month or next
7. **Redirect to Dashboard**

**Note:** Review offer is only shown during first-ever registration, not for subsequent GRCs.

### 3.2.1 Returning Member GRC Onboarding

**Route:** `/member/grc-onboarding/[grcId]`

When existing member receives a new GRC (from same or different merchant):

**Steps:**
1. **Personal Info** - Pre-populated from last time, can update if needed
2. **Grocery Store Selection** - Pre-populated from last GRC, can choose new store for this GRC
3. **Survey** - Questions from the new merchant
4. **Redirect to Dashboard** - "GRC added to your queue!"

**Key differences from new member flow:**
- Personal info is pre-filled (not blank)
- Grocery store shows previous selection (can change)
- No review offer (one-time bonus only)
- No start date selection (GRC goes to queue, activates when current one completes)

**Note:** Grocery store selected here is LOCKED for this GRC's entire duration. Member cannot change it until they start a new GRC.

**Review Requirements:**
- Minimum 50 words to submit (show live word count)
- Member can skip entirely (no bonus month)
- If submitted with 50+ words → +1 bonus month added to GRC

**Start Date Selection:**
After registration, member chooses when to start:

Option 1: "Start This Month"
- Current month counts as month 1
- Show warning based on current date:
  - Before 10th: "You have [X] days left to submit $100 in receipts"
  - 10th-20th: "You have [X] days left - make sure you can submit $100 in receipts this month"
  - After 20th: "⚠️ Only [X] days left this month. If you can't reach $100 in time, consider starting next month."
- Member confirms they understand

Option 2: "Start Next Month" (Recommended if after 20th)
- First day of next month is month 1
- Full month to submit receipts
- No risk of missing first month

**Google Places Integration:**
- File: `src/components/google-places-autocomplete.tsx`
- Filter by type: `grocery_or_supermarket`
- Store: name, placeId in member record
- Lock store for duration of GRC (for receipt moderation)

### 3.3 GRC Queue Logic

- Members can receive multiple GRCs from different merchants
- GRCs are processed FIFO (First In, First Out)
- Only one GRC active at a time
- When current GRC completes, next in queue becomes active

**GRC Completion Flow:**
1. Member completes all months of active GRC
2. GRC status changes to `completed`
3. Dashboard shows "Congratulations! You've completed your [Merchant Name] GRC!"
4. Email sent: completion summary + thank you
5. If queued GRCs exist → next one auto-activates, member notified
6. If no queue → prompt to explore marketplace

### 3.3.2 GRC Expiry Rules

**Registration Deadline:**
- GRC must be registered within 30 days of issuance
- If not registered → status changes to `expired`
- Merchant sees "Expired (not registered)" in their dashboard

**Missed Months:**
- If member misses a month (doesn't reach $100), that month is forfeited
- GRC stays active - member can continue next month
- Remaining months still available
- Example: $100 GRC (4 months) → miss month 2 → still get months 1, 3, 4 if qualified

### 3.3.3 Grocery Store Changes

- Each GRC has its own locked grocery store (chosen during onboarding)
- Store is PERMANENTLY locked for that GRC - no changes allowed, ever
- Member CAN choose a different store when starting a new GRC
- Example:
  - GRC 1 (active): locked to Safeway → must submit Safeway receipts
  - GRC 2 (queued): locked to Kroger → when GRC 1 completes, switch to Kroger receipts

### 3.4 Member Dashboard Home

**Route:** `/member/dashboard`

**Layout (Combined View):**
```
┌─────────────────────────────────────────────┐
│ Header: Welcome, [Name]     [Profile] [Logout]│
├─────────────────────────────────────────────┤
│ ┌─────────────┐  ┌─────────────┐            │
│ │ This Month  │  │ Total GRC   │            │
│ │ Progress    │  │ Balance     │            │
│ │ $45/$100    │  │ $100 (4mo)  │            │
│ │ ████░░░░░░  │  │ + $75 queue │            │
│ └─────────────┘  └─────────────┘            │
├─────────────────────────────────────────────┤
│ Monthly Checklist                           │
│ ✅ Receipts: $102 submitted                 │
│ ⬜ Survey: Not completed [Take Survey →]    │
├─────────────────────────────────────────────┤
│ Recent Receipts          [Upload Receipt]   │
│ ┌─────────────────────────────────────────┐ │
│ │ 12/05 - $23.45 - Pending Review         │ │
│ │ 12/02 - $21.55 - Approved ✓             │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ [Explore Merchant Marketplace →]            │
└─────────────────────────────────────────────┘
```

**Monthly Checklist States:**
- Both incomplete: "Complete both to qualify for your $25 rebate"
- Receipts done, survey pending: "Just one step left - complete your survey!"
- Both complete: "You're qualified for this month! 🎉"

### 3.5 Receipt Upload

**Route:** `/member/dashboard/upload`

**Features:**
- Photo upload (multiple receipts allowed per month)
- Shows selected grocery store (locked, display only)
- Running total for current month (approved + pending shown separately)
- Status: Pending Review → Approved/Rejected

**File:** `src/app/api/receipts/upload/route.ts`

### 3.5.1 Receipt Upload Flow (with Veryfi OCR)

**Step 1: Member uploads photo**
- Member selects/takes photo of receipt
- Photo uploaded to Vercel Blob

**Step 2: Veryfi OCR extraction**
- Send image to Veryfi API
- Extract: store name, receipt date, total amount
- Store raw Veryfi response for reference

**Step 3: Validation checks**

**A) Store Name Check:**
- Compare extracted store name with member's locked grocery store
- If MATCH → proceed to duplicate check
- If MISMATCH → show warning: "This receipt appears to be from [extracted store], not [locked store]. Do you still want to submit?"
  - If member cancels → upload aborted
  - If member proceeds → receipt flagged as `storeMismatch: true` for admin review

**B) Duplicate Check:**
- Hash the receipt image
- Check against previous uploads from this member
- If DUPLICATE → block upload, show: "This receipt has already been submitted. If you believe this is an error, contact support@localcityplaces.com"
- If UNIQUE → proceed

**Step 4: Receipt saved**
- Status: `pending`
- Amount: from Veryfi extraction
- Flagged if store mismatch
- Ready for admin moderation

### 3.5.2 Progress Display

Show both approved and pending amounts:
```
This Month's Progress
$60 approved + $40 pending = $100 total
[████████░░]
```

**Timezone:** All month boundaries use Phoenix time (America/Phoenix)

### 3.5.3 Monthly Qualification Logic

**Goal:** Member must submit $100+ in approved grocery receipts AND complete a monthly survey to receive $25 gift card by 21st of following month.

**Requirements to qualify each month:**
1. ✅ $100+ in approved grocery receipts
2. ✅ Complete monthly survey

**Rules:**
- Receipts count toward the month they were SUBMITTED (not approved)
- Multiple receipts allowed per month
- All receipts must be from member's locked grocery store
- Receipt date on the actual receipt should match the submission month
- Survey must be completed before month ends to qualify

**Monthly Status:**
- `in_progress` - Month is current, member can still upload/survey
- `receipts_complete` - Hit $100, survey not yet done
- `qualified` - Receipts $100+ AND survey completed
- `pending_review` - Month ended, some receipts still pending moderation
- `forfeited` - Month ended, didn't meet requirements

### 3.5.2 Receipt Status Flow

```
pending → approved ✓ (counts toward $100)
        → rejected ✗ (doesn't count)
```

**Receipt fields:**
- `status`: pending | approved | rejected
- `amount`: dollar amount from receipt
- `submittedAt`: timestamp (determines which month it counts for)
- `rejectionReason`: text (if rejected)
- `reuploadAllowedUntil`: date (grace period, if admin allows)

### 3.5.3 Rejection Handling

**Scenario 1: Rejected DURING the month**
- No special handling needed
- Member can upload more receipts before month ends
- Dashboard shows updated progress

**Scenario 2: Rejected AFTER month ends**

**Case A: Still at $100+ after rejection**
- No problem, member still qualifies
- Just notify member of rejection with reason

**Case B: Rejection drops total below $100**
Admin chooses one of:

1. **"Allow Reupload"**
   - Sets `reuploadAllowedUntil` (e.g., 5 days from now)
   - Member notified via email + dashboard alert
   - Member uploads replacement receipt (must be dated from original month)
   - If approved before deadline → qualifies
   - If deadline passes → forfeited

2. **"Final Rejection"**
   - No grace period
   - Month marked as forfeited
   - Member notified why

### 3.5.4 Member Dashboard Alerts

Show alerts for:
- "Upload replacement receipt by [date]" - when grace period active
- "Receipts pending review" - when month ended but receipts not yet reviewed
- "You qualified for [Month]! Gift card coming by [date]" - success
- "You did not qualify for [Month]" - forfeited

### 3.5.5 Admin Moderation View

For each receipt:
- Receipt image
- Member's locked grocery store name
- Veryfi extracted data: store name, date, amount
- Flags: store mismatch warning (if applicable)
- Submitted date
- Actions: Approve | Reject

**Rejection Reasons (predefined dropdown + optional notes):**
- Wrong store
- Wrong date (not from qualifying month)
- Unreadable/blurry image
- Duplicate receipt
- Not a grocery receipt
- Amount unclear
- Other (requires note)

Optional: Additional notes field for context

For rejections that drop member below $100:
- Additional prompt: "Allow reupload?" with grace period selector (3/5/7 days)

### 3.6 Merchant Marketplace

**Note:** Marketplace will be built in a later phase. For now, dashboard will show placeholder/coming soon.

### 3.7 Member Profile Page

**Route:** `/member/profile`

**Sections:**

**1. Personal Info (editable)**
- Name
- Email (display only, contact support to change)
- Phone
- Address, City, State, Zip

**2. Grocery Store**
- Current locked store (display only)
- "Need to change? Contact support" link

**3. GRC History**
| Merchant | Denomination | Status | Months Qualified | Started | Completed |
|----------|--------------|--------|------------------|---------|-----------|
| Sparkle Car Wash | $100 | Active | 2/4 | Nov 2024 | - |
| Fork & Spirits | $75 | Completed | 3/3 | Aug 2024 | Oct 2024 |

**4. Qualification History**
| Month | Status | Approved Amount | Rebate Sent |
|-------|--------|-----------------|-------------|
| Dec 2024 | In Progress | $45 | - |
| Nov 2024 | Qualified | $112 | Dec 15, 2024 |
| Oct 2024 | Forfeited | $67 | - |

**5. All Receipts**
- Filterable by month, status
- Show: date, amount, status, store name
- Click to view receipt image

### 3.8 Member API Routes

```
POST /api/member/register - Complete registration
GET  /api/member/profile - Get member data
PUT  /api/member/profile - Update profile
GET  /api/member/grcs - List member's GRCs
GET  /api/member/receipts - List submitted receipts
POST /api/receipts/upload - Upload receipt image
GET  /api/marketplace - List offers in member's city
POST /api/marketplace/claim - Claim an offer
POST /api/surveys/respond - Submit survey response
POST /api/reviews/submit - Submit merchant review
```

---

## Part 4: Merchant Dashboard (Future Plan)

### Key Features:
- Issue GRCs to customers
- View issued GRCs and redemption status
- Create/manage surveys
- View reviews received
- Marketplace offer management
- Analytics: GRCs issued, redemption rate, new customers

### 4.1 GRC Issuance

**Routes:**
- `/merchant/issue-grc` - Individual issuance
- `/merchant/issue-grc/bulk` - Bulk upload

**Individual Issuance Form:**
- Email (required)
- Recipient name (optional)
- Denomination (dropdown - only shows denominations merchant has purchased/available)

**Bulk Upload:**
- CSV upload with columns: email, name (optional), denomination
- Validate all rows before processing
- Show preview with errors highlighted
- Only allow denominations merchant has in inventory

**GRC Inventory:**
- Merchants purchase GRCs in bulk (via grc_purchases table)
- Each purchase adds to their available inventory per denomination
- Issuing a GRC decrements from inventory
- Dashboard shows: available GRCs by denomination

### 4.1.1 Merchant GRC Dashboard View

**Stats Overview:**
- Total GRCs issued (all time)
- Currently active (being redeemed)
- Completed
- Expired

**Recipient List:**
| Email | Name | Denomination | Status | Issued Date |
|-------|------|--------------|--------|-------------|
| john@... | John D. | $100 | Active (2/4 months) | Dec 1, 2024 |
| jane@... | Jane S. | $75 | Registered | Dec 3, 2024 |
| bob@... | - | $50 | Pending (not registered) | Dec 5, 2024 |

**Status meanings:**
- `Pending` - GRC sent, recipient hasn't registered yet
- `Registered` - Recipient registered, not yet submitting receipts
- `Active` - Currently redeeming (shows months progress)
- `Completed` - All months done
- `Expired` - Never registered or stopped redeeming

### 4.2 Survey Management

**Question types (Simple Start):**
- Text (short answer)
- Multiple choice (single select)

**Future additions:**
- Rating (1-5 stars)
- Checkboxes (multi-select)
- Yes/No

**Survey builder:**
- Add/remove/reorder questions
- Set question as required or optional
- Preview survey
- Activate/deactivate survey

### Routes:
- `/merchant/dashboard`
- `/merchant/issue-grc`
- `/merchant/surveys`
- `/merchant/reviews`
- `/merchant/offers`
- `/merchant/analytics`

---

## Part 5: Admin Dashboard (Future Plan)

### Key Features:
- Receipt moderation queue
- Verify receipt matches member's grocery store
- Approve/reject receipts
- Gift card fulfillment
- User management (members, merchants)
- Category management
- Survey template management
- System analytics

### 5.1 Gift Card Fulfillment

**Route:** `/admin/gift-cards`

**Gift Card Type:**
- **Digital gift cards** (emailed to member)
- **Primary:** Gift card for member's locked grocery store
- **Fallback:** Generic Visa gift card if grocery store card unavailable
- Communicate to member: "You'll receive a digital gift card for [Grocery Store] or a Visa gift card"

**Batch Export Flow:**
1. View list of qualified members for a given month (status = `qualified`, rewardSentAt = null)
2. Export as CSV with member info + grocery store
3. Admin purchases digital gift cards (grocery store or Visa fallback)
4. Admin emails gift card codes to members
5. Admin returns to dashboard, selects month, clicks "Mark Batch as Sent"
6. All qualifying members for that month get `rewardSentAt` timestamp

**Columns in export:**
- Member name
- Email
- Grocery store name
- Amount ($25)

**Dashboard shows:**
- Pending fulfillment count by month
- History of sent batches

### 5.2 Analytics Dashboard

**Route:** `/admin/analytics`

**Basic Counts:**
- Total members (registered)
- Total merchants
- Total GRCs issued / active / completed / expired
- Total receipts pending / approved / rejected
- Total qualifications this month
- Gift cards pending fulfillment

**Charts + Trends:**
- New member registrations over time
- GRC issuance over time
- Qualification rate by month
- Receipt approval rate

**Google Analytics Integration:**
- Embed Google Analytics dashboard directly into admin panel
- Use Google Analytics Data API to pull key metrics
- Show: page views, user sessions, traffic sources, conversion funnels

### 5.3 Category Management

**Route:** `/admin/categories`

- View all categories
- Add new category
- Edit category name
- Delete category (only if no merchants assigned)

### Routes:
- `/admin/dashboard`
- `/admin/moderation`
- `/admin/gift-cards`
- `/admin/users`
- `/admin/categories`
- `/admin/surveys`
- `/admin/analytics`

---

## All Routes & Views

### Public Pages
| Route | Description |
|-------|-------------|
| `/` | Homepage - login buttons + "Learn about GRC" link |
| `/grc` | GRC landing page for merchants (public marketing) |
| `/claim/[grcId]` | GRC claim page - routes to login or registration |
| `/help` | Help center / FAQ |
| `/support` | Contact form |
| `/terms` | Terms of service (placeholder) |
| `/privacy` | Privacy policy (placeholder) |

### Auth Pages
| Route | Description |
|-------|-------------|
| `/auth/verify` | Magic link verification landing |
| `/auth/check-email` | "Check your email" confirmation page |

### Member Pages (Protected)
| Route | Description |
|-------|-------------|
| `/member/register` | Multi-step registration flow (new members) |
| `/member/register/survey` | Survey step during registration |
| `/member/register/review` | One-time review offer step |
| `/member/register/start-date` | Choose start this month or next |
| `/member/grc-onboarding/[grcId]` | Survey-only flow for returning members with new GRC |
| `/member/dashboard` | Main dashboard - progress, balance, receipts, survey status |
| `/member/dashboard/upload` | Receipt upload page |
| `/member/dashboard/survey` | Monthly survey (required to claim $25) |
| `/member/profile` | Profile settings + history |
| `/member/profile/delete` | Account deletion confirmation |
| `/member/marketplace` | Merchant marketplace (coming soon placeholder) |

### Merchant Pages (Protected)
| Route | Description |
|-------|-------------|
| `/merchant/dashboard` | Main dashboard - stats, GRC inventory |
| `/merchant/issue-grc` | Issue individual GRC form |
| `/merchant/issue-grc/bulk` | Bulk CSV upload |
| `/merchant/grcs` | List of all issued GRCs with status |
| `/merchant/surveys` | Survey management |
| `/merchant/surveys/new` | Create new survey |
| `/merchant/surveys/[id]` | Edit survey |
| `/merchant/reviews` | View received reviews |
| `/merchant/offers` | Marketplace offers (future) |
| `/merchant/analytics` | Merchant analytics |
| `/merchant/settings` | Account settings, bank info |

### Admin Pages (Protected)
| Route | Description |
|-------|-------------|
| `/admin/dashboard` | Overview - counts, alerts, pending items |
| `/admin/moderation` | Receipt moderation queue |
| `/admin/moderation/[receiptId]` | Individual receipt review |
| `/admin/gift-cards` | Gift card fulfillment |
| `/admin/gift-cards/export` | Export qualified members CSV |
| `/admin/users` | User management (members + merchants) |
| `/admin/users/members` | Member list |
| `/admin/users/members/[id]` | Member detail + edit |
| `/admin/users/merchants` | Merchant list |
| `/admin/users/merchants/[id]` | Merchant detail + edit |
| `/admin/categories` | Category management |
| `/admin/surveys` | Survey templates (future) |
| `/admin/analytics` | System analytics + Google Analytics |

### API Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/magic-link` | POST | Request magic link |
| `/api/auth/verify` | GET | Verify magic link token |
| `/api/auth/logout` | POST | Clear session |
| `/api/member/register` | POST | Complete registration |
| `/api/member/profile` | GET/PUT | Get/update profile |
| `/api/member/profile/delete` | DELETE | Delete account |
| `/api/member/grcs` | GET | List member's GRCs |
| `/api/member/receipts` | GET | List submitted receipts |
| `/api/receipts/upload` | POST | Upload receipt image |
| `/api/member/survey` | GET | Get current month's survey |
| `/api/member/survey` | POST | Submit monthly survey response |
| `/api/reviews/submit` | POST | Submit merchant review |
| `/api/marketplace` | GET | List offers in city |
| `/api/marketplace/claim` | POST | Claim an offer |
| `/api/merchant/grcs` | GET | List merchant's issued GRCs |
| `/api/merchant/grcs/issue` | POST | Issue single GRC |
| `/api/merchant/grcs/bulk` | POST | Bulk issue GRCs |
| `/api/merchant/surveys` | GET/POST | List/create surveys |
| `/api/merchant/surveys/[id]` | GET/PUT/DELETE | Survey CRUD |
| `/api/merchant/reviews` | GET | List received reviews |
| `/api/admin/receipts` | GET | List receipts for moderation |
| `/api/admin/receipts/[id]/approve` | POST | Approve receipt |
| `/api/admin/receipts/[id]/reject` | POST | Reject receipt |
| `/api/admin/users` | GET | List users |
| `/api/admin/users/[id]` | GET/PUT/DELETE | User CRUD |
| `/api/admin/categories` | GET/POST | List/create categories |
| `/api/admin/categories/[id]` | PUT/DELETE | Category CRUD |
| `/api/admin/gift-cards/export` | GET | Export qualified members |
| `/api/admin/gift-cards/mark-sent` | POST | Mark batch as sent |
| `/api/admin/analytics` | GET | Get analytics data |
| `/api/cron/send-reminders` | POST | Cron: send reminder emails |
| `/api/cron/month-rollover` | POST | Cron: monthly rollover |
| `/api/cron/expire-grcs` | POST | Cron: expire old GRCs |
| `/api/cron/check-grace-periods` | POST | Cron: check grace periods |
| `/api/cron/merchant-digest` | POST | Cron: weekly merchant digest |

---

## Implementation Order

### Phase 1: Foundation + GRC Landing Page
1. Set up Drizzle database schema and connection
2. Implement authentication (magic link)
3. Build GRC landing page at `/grc`
4. Create shared UI components

### Phase 2: Member Dashboard
1. Member registration flow with Google Places
2. Dashboard home with progress/balance view
3. Receipt upload functionality
4. Merchant marketplace browsing

### Phase 3: Merchant Dashboard
1. GRC issuance flow
2. Survey management
3. Offer management
4. Analytics

### Phase 4: Admin Dashboard
1. Receipt moderation queue
2. User management
3. System oversight

---

## Files to Create/Modify

### Database
- `src/db/schema.ts` (new)
- `src/db/index.ts` (new)
- `drizzle.config.ts` (new)

### Authentication
- `src/app/api/auth/magic-link/route.ts` (new)
- `src/app/api/auth/verify/route.ts` (new)
- `src/lib/auth.ts` (new)
- `src/middleware.ts` (new)

### GRC Landing Page
- `src/app/grc/page.tsx` (new)
- `src/components/grc/pricing-slider.tsx` (new)
- `src/components/grc/hero-section.tsx` (new)
- `src/components/grc/feature-cards.tsx` (new)

### Member Dashboard
- `src/app/member/layout.tsx` (new)
- `src/app/member/register/page.tsx` (new)
- `src/app/member/dashboard/page.tsx` (new)
- `src/app/member/marketplace/page.tsx` (new)
- `src/components/google-places-autocomplete.tsx` (new)
- `src/components/receipt-upload.tsx` (new)
- `src/components/dashboard-layout.tsx` (new)

### API Routes
- `src/app/api/member/*` (new)
- `src/app/api/receipts/*` (new)
- `src/app/api/marketplace/*` (new)
- `src/app/api/surveys/*` (new)

### Email
- `src/lib/email.ts` (new)

---

## Infrastructure

**Hosting:**
- **App:** Vercel
- **Database:** Neon (serverless PostgreSQL)
- **File Storage:** Vercel Blob
- **Email:** Postmark
- **OCR:** Veryfi
- **Live Chat:** Crisp

**Neon Setup:**
- Create project in Neon dashboard
- Use connection pooling for serverless (add `?sslmode=require` to URL)
- Enable branching for preview deploys (optional)

## Environment Variables Needed

```env
# Database (Neon)
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=...
MAGIC_LINK_SECRET=...

# Email (Postmark)
POSTMARK_API_KEY=...
POSTMARK_FROM_EMAIL=noreply@localcityplaces.com

# Google Places
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=...

# File Upload (Vercel Blob)
BLOB_READ_WRITE_TOKEN=...

# Receipt OCR (Veryfi)
VERYFI_CLIENT_ID=...
VERYFI_CLIENT_SECRET=...
VERYFI_USERNAME=...
VERYFI_API_KEY=...
```

---

## Technical Decisions Made

1. **Email:** Postmark (transactional + marketing via Message Streams)
2. **File storage:** Vercel Blob for receipt photos
3. **Receipt OCR:** Veryfi for automatic extraction (store, date, amount)
4. **Merchant payments:** Simple encrypted form for bank routing/account numbers
5. **Gift card fulfillment:** Batch export CSV, admin mails, mark batch as sent
6. **Timezone:** Phoenix (America/Phoenix) for all month boundaries
7. **Surveys:** Simple start - text and multiple choice only

---

## Merchant Payment & GRC Purchase Flow

### Payment Options

**1. Bank Account (ACH)**
- Merchant provides: routing number, account number, account type, account holder name
- GRCs issued **immediately** after checkout
- Accounting team manually pulls payment later using stored bank info
- Bank info saved for future purchases

**2. Zelle**
- Display Local City Places Zelle ID (email/phone)
- Merchant sends payment manually from their bank
- GRCs **pending** until admin confirms payment received
- Admin marks order as "Paid" → GRCs issued

### Checkout Flow

1. Merchant selects denomination + quantity (min 50 certs)
2. Review total cost
3. Choose payment method:
   - **Bank Account** → Collect bank info (if not on file) → GRCs issued immediately
   - **Zelle** → Show Zelle instructions → Order pending → Admin confirms → GRCs issued
4. Confirmation page with GRC codes/links

### Database Updates

```
grc_purchases table additions:
- paymentMethod: 'bank_account' | 'zelle'
- paymentStatus: 'pending' | 'confirmed' | 'failed'
- paymentConfirmedAt: timestamp
- paymentConfirmedBy: adminUserId
```

### Bank Info Collection

For bank account payments, we collect:
- Bank routing number (9 digits)
- Account number
- Account type (checking/savings)
- Account holder name

**Security considerations:**
- Store encrypted in database (AES-256)
- Use field-level encryption
- Limit access to admin only
- Accounting team views decrypted info for manual processing

**File:** `src/components/forms/bank-account-form.tsx`

---

## Security

### Authentication Security
- **Rate Limiting:** 10 attempts per 15 min on magic link requests
- **Magic Link Expiry:** Links expire after 15 minutes
- **JWT Tokens:** httpOnly cookies, secure flag, 7-day expiry
- **CSRF Protection:** Built into Next.js

### Data Security
- **Bank Info Encryption:** AES-256 encryption at app level
  - Encrypt before storing, decrypt when needed
  - Key stored in `ENCRYPTION_KEY` env var
  - Only admins can view decrypted data
- **Receipt Images:** Stored in Vercel Blob with signed URLs
- **Passwords:** N/A - using magic link auth (no passwords stored)

### Admin Access
- **Initial Setup:** Seed script creates first admin account
- **Admin Routes:** Protected by middleware checking user role
- **Sensitive Actions:** Log all admin actions (receipt approvals, user changes)

### Environment Variables Security
```env
ENCRYPTION_KEY=... # 32-byte key for AES-256
CRON_SECRET=...    # Verify cron job requests
JWT_SECRET=...     # Sign JWT tokens
```

---

## Decisions Made

1. **GRC Claim Flow:** `/claim/[grcId]` - looks up email, either logs in existing member or starts registration
2. **GRC Queue:** FIFO - one active at a time, next in queue activates when current completes
3. **Review Bonus:** First registration only, not for subsequent GRCs
4. **Categories:** Admin-managed with starter list, admins can add new ones. Optional for merchants, can be assigned later.
5. **Moderation Notifications:** Dashboard badge only (no email notifications)
6. **Merchants:** Invite-only for now
7. **Receipt Amount:** Veryfi OCR extracts automatically, member doesn't enter
8. **Store Mismatch:** Warn member, allow proceed with flag for admin review
9. **Duplicate Receipts:** Block upload, provide support email for disputes
10. **Rejection Reasons:** Predefined dropdown + optional notes
11. **Progress Display:** Show approved + pending separately
12. **GRC Issuance:** Individual form + bulk CSV upload, denomination limited to purchased inventory
13. **GRC Completion:** Show message, send email, auto-activate next in queue
14. **Store Changes:** Admin-only, member contacts support to request
15. **Merchant GRC View:** Stats + detailed recipient list with status
16. **Marketplace:** Deferred to later phase
17. **GRC Expiry:** 30 days to register, or expires
18. **Missed Months:** GRC stays active, just forfeit that month's rebate
19. **Reminders:** Email on 15th and 25th with progress + amount remaining
20. **Review:** Skip or submit 50+ words, no in-between
21. **Rebate Amount:** Always $25 regardless of GRC denomination
22. **Start Date:** Member chooses "Start This Month" or "Start Next Month" with warnings if late in month
23. **Member Profile:** Full dashboard with history, all receipts, past qualifications
24. **Automation:** Vercel Cron for reminders, month rollover, expiry checks
25. **Analytics:** Basic counts + charts + Google Analytics integration in admin
26. **Support:** Email + contact form + Crisp live chat + help center
27. **Receipt Emails:** Only email on rejection (approval shows in dashboard)
28. **Merchant Notifications:** Weekly digest email + dashboard updates for registrations
29. **Platform:** Responsive web, PWA optional later
30. **Video Placeholder:** 1:1 square aspect ratio
31. **Receipt Limits:** No upload limits
32. **Merchant Digest:** Weekly on Monday mornings
33. **Legal Pages:** Terms of service + privacy policy with placeholder text
34. **Admin Roles:** Single admin role for now, can expand to super_admin/moderator later
35. **Encryption:** AES-256 app-level for bank info
36. **Rate Limiting:** 10 attempts per 15 min on auth endpoints
37. **Admin Setup:** Seed script creates first admin
38. **Testing:** Manual testing for MVP, add automated tests later
39. **Staging:** Use Vercel preview deploys for PRs (no dedicated staging)
40. **Database:** Neon serverless PostgreSQL
41. **From Email:** hello@localcityplaces.com
42. **Account Deletion:** Self-service from profile settings
43. **GRC Email Sender:** From LocalCityPlaces, merchant mentioned in body
44. **GRC Landing:** Public (no login required)
45. **Data Deletion:** Hard delete immediately (all related data deleted)
46. **Merchant Privacy:** Merchants see full recipient info (email + name)
47. **Homepage:** Add "Learn about GRC" link to homepage
48. **SEO:** Basic meta tags, title, description, Open Graph for GRC landing page
49. **OCR Failure:** Warn member to check resolution, allow submit for manual admin review
50. **Monthly Survey:** Required each month along with $100 receipts to qualify for $25 rebate
51. **Gift Cards:** Digital, sent to member's grocery store; Visa fallback if unavailable
52. **Receipt Limits:** No max receipts per day/month
53. **Cross-Member Receipts:** Same receipt can be submitted by different members (no restriction)
54. **Payment Methods:** Bank account (GRCs immediate) or Zelle (GRCs pending until admin confirms)
55. **Notifications:** Email only (no SMS)
56. **Edge Cases:** Handle manually case-by-case (member moves, store closes, etc.)
