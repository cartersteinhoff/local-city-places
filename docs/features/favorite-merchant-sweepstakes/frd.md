# Favorite Merchant Sweepstakes - Functional Requirements Document

| Field | Value |
|-------|-------|
| **Version** | 1.2 |
| **Status** | Active |
| **Author** | Local City Places Team |
| **PRD Link** | [Implementation Plan](../../favorite-merchant-sweepstakes-plan.md) |
| **Created** | 2026-04-02 |
| **Last Updated** | 2026-04-02 |

---

## Overview

The Favorite Merchant Sweepstakes is a monthly campaign that lets visitors enter once per Arizona calendar day, confirm entry through a magic link, participate as members in a dashboard experience, refer others for matching-prize eligibility, and submit moderated merchant testimonials for additional value and reward qualification.

This feature is not a thin form layered onto the existing review system. It is a connected campaign domain with five linked parts:

1. Public entry and daily confirmation
2. Member participation, referral tracking, and leaderboard visibility
3. Favorite-merchant testimonial submission with merchant search and photo uploads
4. Admin moderation and merchant-page publishing
5. Monthly draw, matching-prize calculation, winner notification, and testimonial reward qualification

Approved testimonials do **not** immediately send the `$25` reward. Approval creates a sweepstakes-originated certificate path under a system merchant, and the member must still complete the existing grocery-store selection and `$100` monthly qualification flow before the reward is sent.

---

## Scope

### In Scope

- Dedicated campaign landing page at `/favorite-merchant-sweepstakes`
- Logged-out-only public entry experience with login handoff for existing accounts
- Daily entry flow with magic-link confirmation
- Automatic creation of normal `users` and `members` records when needed
- Stable referral code and referral relationship tracking
- Member dashboard sweepstakes status and referral link
- Multi-step favorite-merchant testimonial form
- Google Places merchant autocomplete reuse
- Vercel Blob public photo uploads for testimonials
- Admin moderation queue
- Merchant-page publishing in a dedicated `Nominated As A Favorite Merchant` section
- Testimonial-backed `$25` certificate qualification path
- Leaderboard with regular entries, referral entries, and combined totals
- Admin-triggered winner draw, manual override, and winner email workflow

### Out of Scope for Phase 1

- Gas-specific qualification rules
- Merchant-candidate creation or resolution workflow for unmatched Google Places results
- Automated winner draw without admin action
- Replacing or merging the current `reviews` table
- Replacing the existing GRC qualification engine

---

## Locked Product Decisions

- Sweepstakes entrants become normal member accounts, not a temporary user type.
- Activated referral means a referred member has a confirmed sweepstakes entry in the cycle.
- Rejected testimonials do not count against the monthly 5-testimonial limit.
- Testimonial submission does not need draft saving.
- Testimonial flow should be multi-step.
- Testimonial photos use Vercel Blob with public URLs.
- Each approved testimonial earns its own `$25` certificate path.
- Reward certificates are issued under a system merchant.
- Grocery is the required first implementation for the reward path.
- Logged-in members should not use the public campaign entry form.
- If a submitted email already belongs to an existing user, the form should tell them to log in instead of silently reusing that account.
- Leaderboard must show regular entries, referral entries, and combined total entries in separate columns.
- Winner selection is admin-triggered.
- Admin can override the drawn winner and trigger a new winner notification workflow.

---

## Actors

| Actor | Role in Flow |
|------|---------------|
| Visitor | Lands on campaign page and submits entry |
| Entrant / Member | Confirms entry, refers others, submits testimonials, follows reward qualification steps |
| Admin | Moderates testimonials, manages cycles, draws winners, overrides winners, sends notifications |
| Merchant Page Visitor | Sees approved testimonial content on merchant public pages |
| System | Handles cycle logic, confirmation, referrals, reward creation, and email triggers |

---

## End-to-End Flow Summary

### Flow A: Public Entry to Confirmed Membership

1. Visitor lands on `/favorite-merchant-sweepstakes`.
2. If the visitor is already logged in, the campaign page hides the public form and routes them toward the member dashboard instead.
3. Logged-out visitor submits first name, last name, email, optional phone, and optional referral code.
4. System validates the active cycle and daily Arizona-time rule.
5. If the submitted email already belongs to an existing user, the public flow stops and the visitor is prompted to log in.
6. If the email is new, the system creates a normal `users` row with role `member`.
7. System creates a normal `members` row.
8. System creates a pending entry for that Arizona local date.
9. System sends a magic link.
10. Visitor clicks the magic link.
11. System confirms the pending entry, signs the member in, and routes them into the member dashboard.

### Flow B: Referral Activation

1. A member shares their referral link.
2. A new visitor enters through that link.
3. System stores the referral code used at entry time.
4. Once the referred visitor confirms their entry, the system creates a cycle-scoped referral activation.
5. Leaderboard and matching-prize logic count that activation.

### Flow C: Favorite-Merchant Testimonial

1. Confirmed member opens the testimonial flow from the dashboard.
2. Member selects a merchant using Google Places powered search.
3. Member writes at least 50 words.
4. Member uploads 2 to 6 photos.
5. Member submits the testimonial.
6. Admin approves, rejects, or requests changes.
7. Approved testimonials publish to the merchant page in a separate section.
8. Approval creates a sweepstakes-sourced certificate path under the system merchant.
9. Member completes the standard grocery-store selection and `$100` receipt qualification flow before fulfillment.

### Flow D: Monthly Draw and Matching Winners

1. Cycle closes at 11:59 PM Arizona time on the last day of the month.
2. Admin clicks `Draw Winner`.
3. System selects a grand-prize winner from eligible confirmed entries in the closed cycle.
4. System calculates tier 1 and tier 2 matching winners from the stable referral chain.
5. System stores draw results and starts winner notification workflow.
6. Admin may override the selected winner with another eligible entry.
7. Override recalculates matching winners and starts a new notification workflow while preserving audit history.

---

## Functional Requirements

### FR-1: Dedicated Campaign Landing Page
**Description:** The sweepstakes must live on a dedicated campaign route and not replace the main homepage.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] Campaign is accessible at `/favorite-merchant-sweepstakes`
- [ ] Main homepage remains intact
- [ ] Landing page clearly explains daily entry, referral matching, testimonial participation, and monthly draw timing
- [ ] Entry form is above the fold on common desktop/mobile viewports
- [ ] Logged-in members do not see or use the public entry form on this page

### FR-2: Public Sweepstakes Entry
**Description:** Visitors can enter the sweepstakes with name and email from the campaign page.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] Entry form collects first name, last name, email, optional phone, and optional referral code
- [ ] Invalid submissions return user-friendly validation errors
- [ ] One entry attempt per user per Arizona local date is enforced
- [ ] Public entry is only available to logged-out visitors
- [ ] If the submitted email belongs to an existing user, the response instructs the visitor to log in instead of creating or reusing a public entry
- [ ] Existing logged-in members are directed into the member dashboard flow for participation instead of reusing the public form

### FR-3: Automatic Account Creation
**Description:** Sweepstakes entry must create normal member-access records when needed so the magic-link flow lands cleanly in the member dashboard.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] If no `users` row exists for the email, the system creates one with role `member`
- [ ] If no `members` row exists for that user, the system creates one immediately
- [ ] Existing user emails are not silently reused through the public campaign form
- [ ] Existing non-member emails are blocked from silent conversion

### FR-4: Magic-Link Confirmation
**Description:** Entry is not confirmed until the user clicks the magic link.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] Entry submission creates a `pending` sweepstakes entry
- [ ] Magic-link verification marks the pending entry `confirmed`
- [ ] After verification, the member is logged in and redirected into the member dashboard flow
- [ ] Confirmation is idempotent and does not duplicate entries if the link is revisited

### FR-5: Monthly Cycle Management
**Description:** Sweepstakes participation must be tied to explicit monthly cycles using Arizona time as the source of truth.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] The system stores one cycle per Arizona month
- [ ] Current cycle can be created automatically if missing
- [ ] Each entry is attached to exactly one cycle
- [ ] Cycle status supports `open`, `closed`, and `drawn`

### FR-6: Referral Code Tracking
**Description:** Each member receives a unique referral code and referral link for the campaign.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] Every member can be assigned one unique referral code
- [ ] Referral links point to the campaign page with the code prefilled
- [ ] Referral code used at entry time is stored on the pending/confirmed entry
- [ ] A member cannot refer themselves

### FR-7: Referral Relationship Assignment
**Description:** Referral ownership must be stable and auditable.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] A referred member can have at most one referrer relationship
- [ ] Referral relationship is established before the member has a confirmed sweepstakes entry
- [ ] Once a member has a confirmed entry, referral ownership cannot be reassigned by later links
- [ ] The system stores which referral code was used

### FR-8: Activated Referral Logic
**Description:** An activated referral is defined as a referred member with a confirmed sweepstakes entry in the cycle.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] A referral activation is created when the referred member's entry becomes `confirmed`
- [ ] Activations are cycle-specific
- [ ] Activations are unique per `(cycle, referrer, referred member)`
- [ ] Leaderboard logic uses confirmed activations, not raw clicks or form starts

### FR-9: Member Sweepstakes Dashboard Summary
**Description:** Members must see sweepstakes status immediately in their dashboard.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] Dashboard shows today's entry status
- [ ] Dashboard shows current-cycle confirmed entries
- [ ] Dashboard shows activated referrals
- [ ] Dashboard shows referral link and supports copy interaction
- [ ] Dashboard can show a `"today's entry confirmed"` success state after magic-link verification

### FR-10: Multi-Step Testimonial Submission
**Description:** Members can submit favorite-merchant testimonials through a dedicated multi-step flow.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] Testimonial flow is separate from the existing review flow
- [ ] Flow is multi-step, with next/back navigation
- [ ] Draft saving is not required
- [ ] Submission is blocked until all required steps are complete
- [ ] Entry into the flow is available from the member dashboard

### FR-11: Merchant Selection via Google Places
**Description:** Members must be able to search for merchants using Google Places autocomplete.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] Testimonial form reuses the existing Google Places integration patterns in the repo
- [ ] Members can search/select a merchant in the form
- [ ] Existing local merchant records are preferred when a known merchant is matched
- [ ] Support for unresolved Google Places merchants can be added later without redesigning the form flow

### FR-12: Testimonial Content Rules
**Description:** Each testimonial must satisfy content and quota rules before submission.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] Testimonial body requires at least 50 words
- [ ] A member can submit up to 5 testimonials per calendar month
- [ ] Rejected testimonials do **not** count against the monthly cap
- [ ] `changes_requested` uses the same testimonial record and does not consume another slot
- [ ] The same member cannot submit duplicate approved testimonials for the same merchant in the same cycle without explicit admin override rules

### FR-13: Testimonial Photo Uploads
**Description:** Testimonials require proof in the form of uploaded photos.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] Each testimonial requires at least 2 photos before submission
- [ ] Each testimonial supports at most 6 photos
- [ ] Photos are stored in Vercel Blob
- [ ] Blob URLs can be public
- [ ] Photo metadata is stored separately from testimonial text content

### FR-14: Admin Moderation
**Description:** Admin must moderate every testimonial before it appears publicly or triggers the reward path.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] Admin can view a testimonial moderation queue
- [ ] Admin can approve, reject, or request changes
- [ ] Rejection requires a reason
- [ ] Approval stores reviewer identity and approval timestamp
- [ ] Moderation state is visible to the member in dashboard history

### FR-15: Merchant-Page Publishing
**Description:** Approved testimonials must publish to the merchant page in a separate section.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] Approved testimonials appear in a dedicated section titled `Nominated As A Favorite Merchant`
- [ ] Existing `Reviews` section remains separate
- [ ] Approved testimonial content does not affect standard review counts or ratings
- [ ] Approved testimonial content is managed independently from standard review content and queries
- [ ] Unapproved testimonials never render publicly
- [ ] Photos attached to approved testimonials render with the public testimonial content

### FR-16: $25 Testimonial Reward Creation
**Description:** Each approved testimonial earns its own `$25` certificate path.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] One approved testimonial creates one reward-backed certificate path
- [ ] Reward certificates are issued under a system merchant
- [ ] Sweepstakes-originated rewards are distinguishable from standard merchant-issued GRCs
- [ ] Reward creation is tied to testimonial approval and recorded for auditability

### FR-17: $25 Reward Qualification Flow
**Description:** The `$25` reward must use the existing GRC qualification model rather than bypass it.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] Member must choose the grocery store they will shop at
- [ ] Member must complete the standard `$100` monthly receipt qualification before reward send
- [ ] Admin gift-card fulfillment continues to operate from the qualification state, not from testimonial approval alone
- [ ] Sweepstakes-issued GRCs use a source marker or source reference back to the testimonial
- [ ] Grocery is the required first implementation; gas behavior is deferred

### FR-18: Leaderboard
**Description:** The leaderboard must show regular entries, referral entries, and combined totals.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] Leaderboard is scoped to the active/current cycle by default
- [ ] Each member row shows regular confirmed entries
- [ ] Each member row shows referral entries derived from activated referrals
- [ ] Each member row shows combined total entries
- [ ] Sorting defaults to combined total, with deterministic tie-breaking

### FR-19: Winner Draw
**Description:** Admin must explicitly trigger winner selection for the cycle.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] Admin can click a `Draw Winner` action for a closed cycle
- [ ] Draw selects a grand-prize winner from eligible confirmed entries in that cycle
- [ ] Draw calculates first-tier and second-tier matching winners from stable referral relationships
- [ ] Draw results are stored with timestamps and acting admin identity

### FR-20: Manual Winner Override
**Description:** Admin must be able to override the automatically drawn winner.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] Admin can manually choose a different eligible winner after an automatic draw
- [ ] Override recalculates first-tier and second-tier matching winners
- [ ] Original draw result remains auditable
- [ ] Override action stores who changed the winner and when

### FR-21: Winner Email Workflow
**Description:** Draw and override actions must trigger winner communications.
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] Winner email workflow starts when admin draws the winner
- [ ] Winner email workflow also starts if admin overrides the winner
- [ ] Grand-prize winner and matching winners have separate notification states
- [ ] Admin can resend winner emails
- [ ] Email state is tracked independently from prize claim/fulfillment state

---

## Non-Functional Requirements

### Performance
- Campaign entry API should complete in under 1 second excluding email delivery latency
- Dashboard sweepstakes summary should load in under 500ms under normal local or production DB conditions
- Leaderboard queries should be index-backed and support at least the active cycle without full-table scans
- Merchant-page testimonial rendering should not noticeably degrade current merchant-page load times

### Security
- Magic-link auth remains the only public authentication mechanism for entry
- Public entry must not expose whether an email already exists beyond controlled business rules
- Admin moderation, draw, and override endpoints require admin role
- Member testimonial routes require authenticated member role
- Public Blob URLs are allowed, but unapproved testimonials must never be exposed in application UI
- The system must not silently convert admin or merchant accounts into member accounts through the sweepstakes flow

### Reliability
- Entry confirmation must be idempotent
- Referral activation creation must be idempotent
- Draw and override actions must be auditable and repeat-safe
- Reward creation on testimonial approval must not silently create duplicate reward paths

### Scalability
- Support at least one active monthly cycle with daily entries from a growing member base
- Support leaderboard queries over large entry volumes by cycle
- Support photo-heavy testimonial content through Vercel Blob rather than database file storage

### Observability
- Entry creation, confirmation, moderation, reward creation, draw, override, and winner email triggers should all be logged or audit-recorded
- Admin-facing actions should preserve actor identity and timestamps

---

## State Models

### Sweepstakes Cycle Status

| Status | Meaning |
|--------|---------|
| `open` | Accepting entries and testimonials for the active month |
| `closed` | Entry window has ended and the cycle is ready for draw |
| `drawn` | Winner workflow has been executed for the cycle |

### Sweepstakes Entry Status

| Status | Meaning |
|--------|---------|
| `pending` | Form submitted but not yet confirmed by magic link |
| `confirmed` | Entry counted for the cycle |
| `void` | Entry intentionally invalidated by admin or system rule |

### Testimonial Moderation Status

| Status | Meaning |
|--------|---------|
| `submitted` | Awaiting admin review |
| `changes_requested` | Member must revise and resubmit the same testimonial record |
| `approved` | Cleared for publishing and reward creation |
| `rejected` | Permanently declined and does not count against the monthly cap |

### Testimonial Reward Progress

| Status | Meaning |
|--------|---------|
| `not_created` | No reward path exists yet |
| `registration_required` | Testimonial approved and member must start reward registration |
| `qualifying` | Member has started qualification but has not yet qualified |
| `qualified` | Ready for fulfillment in the existing admin gift-card flow |
| `fulfilled` | Reward has been sent |
| `void` | Reward path canceled or invalidated |

### Winner Notification Status

| Status | Meaning |
|--------|---------|
| `pending` | Notification has not been sent yet |
| `sent` | Notification sent successfully |
| `failed` | Notification attempt failed |
| `resent` | Notification sent again after an earlier attempt |

---

## Data Model

### `sweepstakes_cycles`
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| year | integer | No | Arizona calendar year |
| month | integer | No | Arizona calendar month (1-12) |
| name | varchar(120) | No | Human-readable cycle label |
| startsAt | timestamp | No | First instant of the cycle |
| endsAt | timestamp | No | Last instant of the cycle |
| status | enum | No | `open`, `closed`, `drawn` |
| grandPrizeLabel | varchar(255) | No | Prize label shown in UI/admin |
| createdAt | timestamp | No | Record creation time |
| updatedAt | timestamp | No | Record update time |

### `sweepstakes_entries`
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| cycleId | uuid | No | FK to `sweepstakes_cycles` |
| userId | uuid | No | FK to `users` |
| memberId | uuid | No | FK to `members` |
| entryName | varchar(255) | No | Snapshot of submitted name |
| entryEmail | varchar(255) | No | Snapshot of submitted email |
| entryLocalDate | varchar(10) | No | Arizona local date key `YYYY-MM-DD` |
| status | enum | No | `pending`, `confirmed`, `void` |
| source | enum | No | `campaign_page` or `dashboard` |
| referralCodeUsed | varchar(32) | Yes | Code entered/attached at entry |
| confirmedAt | timestamp | Yes | Entry confirmation time |
| createdAt | timestamp | No | Submission time |
| updatedAt | timestamp | No | Last change time |

### `sweepstakes_referral_codes`
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| memberId | uuid | No | FK to `members` |
| code | varchar(32) | No | Unique member referral code |
| createdAt | timestamp | No | Record creation time |

### `member_referrals`
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| referrerMemberId | uuid | No | FK to `members` |
| referredMemberId | uuid | No | FK to `members` |
| referralCodeUsed | varchar(32) | Yes | Captured code used to create relationship |
| createdAt | timestamp | No | Record creation time |

### `sweepstakes_referral_activations`
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| cycleId | uuid | No | FK to `sweepstakes_cycles` |
| referrerMemberId | uuid | No | FK to `members` |
| referredMemberId | uuid | No | FK to `members` |
| activatingEntryId | uuid | No | FK to `sweepstakes_entries` |
| activatedAt | timestamp | No | Activation time |

### `favorite_merchant_testimonials` (planned)
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| cycleId | uuid | No | FK to `sweepstakes_cycles` |
| memberId | uuid | No | FK to `members` |
| merchantId | uuid | No | FK to `merchants` |
| content | text | No | Testimonial body |
| wordCount | integer | No | Stored word count |
| status | enum | No | `submitted`, `changes_requested`, `approved`, `rejected` |
| rejectionReason | text | Yes | Admin rejection explanation |
| approvedAt | timestamp | Yes | Approval timestamp |
| approvedBy | uuid | Yes | FK to `users` |
| rewardStatus | enum | No | Reward state for the testimonial |
| rewardReferenceId | uuid | Yes | Links to reward/GRC source |
| createdAt | timestamp | No | Submission time |
| updatedAt | timestamp | No | Last change time |

### `favorite_merchant_testimonial_photos` (planned)
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| testimonialId | uuid | No | FK to `favorite_merchant_testimonials` |
| blobUrl | text | No | Public Vercel Blob URL |
| displayOrder | integer | No | Sort order |
| createdAt | timestamp | No | Upload time |

### `sweepstakes_winners` (planned)
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| cycleId | uuid | No | FK to `sweepstakes_cycles` |
| entryId | uuid | No | Winning entry FK |
| memberId | uuid | No | Winner FK |
| winnerType | enum | No | `grand_prize`, `tier_1_match`, `tier_2_match` |
| derivedFromEntryId | uuid | Yes | Chain source for matching winners |
| selectedBy | uuid | Yes | Admin user FK |
| selectedAt | timestamp | No | Draw/override time |
| notificationStatus | enum | No | Winner email state |
| notes | text | Yes | Admin notes / override reason |

### Existing Table Extensions

#### `grcs`
The existing `grcs` table must support sweepstakes-originated reward certificates.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| sourceType | enum | No | `merchant_issue` or `favorite_merchant_testimonial` |
| sourceReferenceId | uuid | Yes | Reference to originating testimonial/reward record |

### Relationships
```text
users 1---1 members

members 1---* sweepstakes_entries
sweepstakes_cycles 1---* sweepstakes_entries

members 1---1 sweepstakes_referral_codes
members 1---* member_referrals (as referrer)
members 1---1 member_referrals (as referred member)

member_referrals 1---* sweepstakes_referral_activations
sweepstakes_entries 1---0..1 sweepstakes_referral_activations (activation source)

members 1---* favorite_merchant_testimonials
merchants 1---* favorite_merchant_testimonials
favorite_merchant_testimonials 1---* favorite_merchant_testimonial_photos

favorite_merchant_testimonials 1---0..1 grcs (via sourceReferenceId / sourceType)
sweepstakes_cycles 1---* sweepstakes_winners
```

### Key Constraints
- Unique `sweepstakes_cycles(year, month)`
- Unique `sweepstakes_entries(userId, entryLocalDate)`
- Unique `sweepstakes_referral_codes(memberId)`
- Unique `sweepstakes_referral_codes(code)`
- Unique `member_referrals(referredMemberId)`
- Unique `sweepstakes_referral_activations(cycleId, referrerMemberId, referredMemberId)`
- Testimonial photos constrained to min `2` and max `6` at the application layer

### Indexing Guidance
- Index `sweepstakes_entries(cycleId, status, memberId)`
- Index `sweepstakes_entries(entryLocalDate, status)`
- Index `member_referrals(referrerMemberId)`
- Index `favorite_merchant_testimonials(cycleId, status, merchantId)`
- Index `sweepstakes_winners(cycleId, winnerType)`

---

## API Specifications

### Enter Sweepstakes
**Endpoint:** `POST /api/sweepstakes/enter`  
**Auth:** Public  
**Description:** Creates a new member account when the submitted email is new, creates the day's pending entry, stores referral context, and sends a magic link. If the email already belongs to an existing user, the endpoint returns a login-required response instead of silently reusing that account.

**Request:**
```json
{
  "firstName": "Carter",
  "lastName": "Steinhoff",
  "email": "carter@example.com",
  "phone": "(425) 451-8599",
  "referredBy": "ABC123"
}
```

**Response (200):**
```json
{
  "success": true,
  "alreadyEnteredToday": false,
  "message": "Check your email to confirm today's sweepstakes entry."
}
```

**Login Required Response (409):**
```json
{
  "success": false,
  "code": "login_required",
  "message": "This email already has an account. Please log in to continue.",
  "loginUrl": "/login"
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| 400 | Invalid input |
| 409 | Email belongs to an existing user and should be routed to login |
| 500 | Entry creation or email send failed |

### Get Member Sweepstakes Summary
**Endpoint:** `GET /api/member/sweepstakes`  
**Auth:** Member required  
**Description:** Returns current-cycle sweepstakes summary for the dashboard.

**Response (200):**
```json
{
  "cycle": {
    "id": "uuid",
    "name": "April 2026",
    "year": 2026,
    "month": 4,
    "endsAt": "2026-05-01T06:59:59.999Z",
    "grandPrizeLabel": "500 in Gas or Groceries"
  },
  "todayEntry": {
    "id": "uuid",
    "status": "confirmed",
    "confirmedAt": "2026-04-02T17:30:00.000Z"
  },
  "confirmedEntriesThisMonth": 2,
  "activatedReferrals": 1,
  "referralCode": "ABC123",
  "referralLink": "https://localcityplaces.com/favorite-merchant-sweepstakes?ref=ABC123"
}
```

### Create Testimonial Submission (planned)
**Endpoint:** `POST /api/member/sweepstakes/testimonials`  
**Auth:** Member required  
**Description:** Creates a testimonial submission after multi-step validation succeeds.

**Request:**
```json
{
  "merchantId": "uuid",
  "content": "50+ word testimonial text...",
  "photoUrls": [
    "https://blob.vercel-storage.com/...",
    "https://blob.vercel-storage.com/..."
  ]
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| 400 | Word count < 50, invalid merchant, or invalid photo count |
| 401 | Unauthorized |
| 409 | Monthly cap exceeded |

### Upload Testimonial Photo (planned)
**Endpoint:** `POST /api/member/sweepstakes/testimonials/photos`  
**Auth:** Member required  
**Description:** Uploads a photo to Vercel Blob and returns its public URL for the submission flow.

### List Testimonials for Moderation (planned)
**Endpoint:** `GET /api/admin/sweepstakes/testimonials`  
**Auth:** Admin required  
**Description:** Returns paginated testimonial queue with filters by status and search.

### Moderate Testimonial (planned)
**Endpoint:** `PATCH /api/admin/sweepstakes/testimonials/[id]`  
**Auth:** Admin required  
**Description:** Approves, rejects, or requests changes for a testimonial.

**Request:**
```json
{
  "action": "approve"
}
```

or

```json
{
  "action": "reject",
  "reason": "Photos do not show the nominated merchant clearly."
}
```

### Get Leaderboard (planned)
**Endpoint:** `GET /api/sweepstakes/leaderboard?cycle=current`  
**Auth:** Public or Member (final exposure decision can vary)  
**Description:** Returns leaderboard rows with regular entries, referral entries, and combined total entries.

### Draw Winner (planned)
**Endpoint:** `POST /api/admin/sweepstakes/cycles/[cycleId]/draw`  
**Auth:** Admin required  
**Description:** Draws the cycle winner and matching-prize chain, then starts winner email workflow.

### Override Winner (planned)
**Endpoint:** `POST /api/admin/sweepstakes/cycles/[cycleId]/override-winner`  
**Auth:** Admin required  
**Description:** Replaces the selected winner with another eligible entry and restarts winner email workflow.

---

## UI/UX Specifications

### Campaign Landing Page
**Route:** `/favorite-merchant-sweepstakes`  
**Access:** Public

**Key Elements:**
- Public entry form for logged-out visitors
- Matching-prize explanation
- Clear monthly timing language
- CTA into daily entry
- Logged-in state should redirect or swap to a dashboard CTA instead of showing the public form

**User Flow:**
1. Visitor lands on campaign page
2. If the visitor is already logged in, the page directs them to the member dashboard instead of showing the public form
3. Logged-out visitor submits name/email entry form
4. If the email already belongs to an existing user, the page tells them to log in
5. If the email is new, the system sends a magic link
6. Visitor confirms entry and lands in member dashboard

### Member Dashboard Sweepstakes Panel
**Route:** `/member`  
**Access:** Authenticated member

**Key Elements:**
- Today's entry status
- Current-cycle entry count
- Activated referral count
- Referral link with copy button
- CTA to testimonial flow

### Member Testimonial Form
**Route:** `/member/sweepstakes/testimonials/new`  
**Access:** Authenticated member

**Key Elements:**
- Multi-step progress UI
- Google Places merchant search
- Testimonial content step
- Photo upload step
- Review/submit step

**User Flow:**
1. Member starts testimonial flow from dashboard
2. Member selects merchant
3. Member writes 50+ words
4. Member uploads 2-6 photos
5. Member submits for moderation
6. Dashboard shows status

### Admin Testimonial Moderation
**Route:** `/admin/sweepstakes/testimonials`  
**Access:** Admin only

**Key Elements:**
- Paginated moderation table/cards
- Search and status filters
- Detailed review view with full text and photos
- Approve/reject/request changes actions

### Merchant Public Page
**Route:** `/business/[city]/[state]/[slug]`  
**Access:** Public

**Key Elements:**
- Existing merchant content
- Dedicated `Nominated As A Favorite Merchant` section
- Existing `Reviews` section remains separate

### Leaderboard
**Route:** `/favorite-merchant-sweepstakes/leaderboard` or dashboard subview  
**Access:** Final visibility decision TBD

**Key Elements:**
- Member name / identifier
- Regular entries column
- Referral entries column
- Combined entries column
- Current-cycle context

### Admin Winner Workflow
**Route:** `/admin/sweepstakes/winners` and/or `/admin/sweepstakes`  
**Access:** Admin only

**Key Elements:**
- Cycle selector
- `Draw Winner` button
- Winner details and referral chain
- Override action
- Winner email status controls

---

## Integrations And Dependencies

### Existing Internal Systems To Reuse
- JWT and magic-link authentication
- Member dashboard shell
- Existing Google Places autocomplete patterns
- Existing GRC qualification and gift-card fulfillment pipeline
- Existing email sending infrastructure
- Existing admin table, pagination, and moderation patterns

### External Services
- Google Places for merchant autocomplete
- Vercel Blob for testimonial photo storage
- The app's existing email delivery provider for magic links and winner notifications

### Required Configuration
- System merchant record for sweepstakes-issued testimonial rewards
- Google Places environment variables already used by the repo
- Vercel Blob configuration for member testimonial uploads

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Logged-in member lands on the campaign route | Public form is hidden and the member is routed toward the dashboard |
| Existing user submits an email on the campaign form | System does not create a public entry and instead tells them to log in |
| Magic link is clicked twice | Confirmation is idempotent; entry remains confirmed |
| Referral code is invalid | Entry proceeds without referral ownership |
| Referral code is used after the member already has a confirmed entry | Referral ownership is not reassigned |
| Member starts testimonial flow but uploads only one photo | Submission is blocked until minimum photo count is reached |
| Member uploads more than 6 photos | System blocks additional uploads for that testimonial |
| Testimonial is rejected | Rejection does not consume one of the 5 monthly slots |
| Testimonial receives `changes_requested` | Member edits and resubmits the same testimonial record |
| Admin approves testimonial but reward GRC creation fails | Approval remains auditable and reward creation is retried / flagged instead of silently succeeding |
| Draw is run twice for the same cycle | System blocks unsafe duplicate draw or records an explicit override/manual action |
| Admin overrides winner after emails were already sent | New winner workflow is triggered and prior notification history remains auditable |

---

## Acceptance Criteria

- [ ] Public campaign entry works end to end with magic-link confirmation
- [ ] Logged-in members do not use the public campaign form
- [ ] Existing user emails receive a login-required response instead of silent account reuse
- [ ] Daily Arizona-time entry limit is enforced
- [ ] Referral relationships and activations are tracked correctly
- [ ] Member dashboard shows sweepstakes summary and referral link
- [ ] Multi-step testimonial submission works with merchant search, word-count enforcement, and 2-6 Blob photo uploads
- [ ] Admin can approve, reject, and request changes on testimonials
- [ ] Approved testimonials publish to merchant pages in a separate section from reviews
- [ ] Each approved testimonial creates its own sweepstakes-originated `$25` reward certificate path
- [ ] Reward path requires grocery-store selection and normal qualification before send
- [ ] Leaderboard shows regular entries, referral entries, and combined totals
- [ ] Admin can draw a winner, override a winner, and trigger winner email workflow
- [ ] All major actions are auditable

---

## Technical Notes

### Current Implementation Alignment
- Already implemented in the repo:
  - sweepstakes cycle, entry, referral code, referral relationship, and referral activation schema groundwork
  - public `POST /api/sweepstakes/enter`
  - entry-time creation or reuse of normal `users` and `members`
  - magic-link verification hook for confirming pending entries
  - member sweepstakes summary API
  - campaign entry form wired to the real API
  - member dashboard sweepstakes panel
- Needs adjustment to match the current product decision:
  - existing user emails should now receive a login-required response instead of being silently reused through the public campaign form
  - logged-in members should be routed away from the public campaign form and into the dashboard flow
- Still planned:
  - testimonial submission APIs and UI
  - Vercel Blob upload flow for testimonial photos
  - admin testimonial moderation screens
  - merchant-page testimonial publishing
  - testimonial-backed reward creation through the GRC path
  - leaderboard UI
  - winner draw, override, and email operations

### Implementation Approach
- Reuse existing JWT + magic-link auth
- Reuse existing Google Places component for merchant selection
- Reuse Vercel Blob for testimonial photo storage
- Reuse existing GRC qualification flow for the `$25` reward rather than inventing a second reward engine
- Keep testimonials separate from the existing `reviews` table and public review queries

### Key Product Decisions Locked
- Normal `user` + `member` records are created immediately at entry time
- Activated referral = confirmed sweepstakes entry
- Rejected testimonials do not count against the monthly 5-testimonial cap
- Each approved testimonial earns its own `$25` certificate path
- Reward certificates are issued under a system merchant
- Gas is out of scope for the first implementation slice
- Winner draw is admin-triggered, with manual override support
- Draw and override both trigger winner email workflow

### Known Limitations / Deferred Decisions
- Gas-specific behavior is deferred
- Admin resolution flow for Google Places merchants not yet represented in the local merchant DB is deferred
- Final public/private visibility choice for leaderboard route can be finalized during implementation

### Key Files
| File | Purpose |
|------|---------|
| `/src/db/schema.ts` | Sweepstakes and GRC source schema |
| `/src/lib/sweepstakes.ts` | Arizona cycle logic, referral logic, entry confirmation |
| `/src/lib/validations/sweepstakes.ts` | Sweepstakes entry validation |
| `/src/app/api/sweepstakes/enter/route.ts` | Public entry endpoint |
| `/src/app/api/member/sweepstakes/route.ts` | Member sweepstakes summary |
| `/src/app/api/auth/verify/route.ts` | Confirms pending sweepstakes entries during magic-link verification |
| `/src/components/campaigns/favorite-merchant/sweepstakes-entry-form.tsx` | Campaign entry form |
| `/src/app/(dashboard)/member/page.tsx` | Member dashboard sweepstakes panel |
| `/src/components/ui/google-places-autocomplete.tsx` | Merchant autocomplete base component |
| `/src/app/api/member/register-grc/route.ts` | Existing GRC registration flow to reuse for reward qualification |
| `/src/app/api/admin/gift-cards/route.ts` | Existing qualification-driven gift-card fulfillment pattern |
| `/src/app/(marketing)/business/[city]/[state]/[slug]/page.tsx` | Public merchant page route to extend |

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-02 | Local City Places Team | Initial FRD covering campaign entry, testimonials, moderation, rewards, leaderboard, and winner workflow |
| 1.1 | 2026-04-02 | Local City Places Team | Added scope, locked decisions, actors, flow summary, state models, dependencies, and implementation alignment notes |
| 1.2 | 2026-04-02 | Local City Places Team | Updated campaign entry rules so logged-in members do not use the public form and existing-user emails are routed to login |
