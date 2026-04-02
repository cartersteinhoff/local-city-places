# Favorite Merchant Sweepstakes Plan

## Goal

Build the "Who's Your Favorite Merchant and WHY?" monthly sweepstakes into the existing Local City Places app without overloading the current GRC and review flows.

The sweepstakes should support:

- Home page entry with name + email
- One confirmed entry per person per Arizona calendar day
- Magic-link confirmation and dashboard access
- Referral tracking with first-tier and second-tier matching winners
- Member leaderboard for entries and activated referrals
- Monthly testimonial submissions for favorite merchants
- Admin moderation before testimonials appear publicly
- Approved testimonials unlock the $25 certificate qualification flow
- Admin-run monthly winner selection and notifications

## Current Codebase Fit

The repo already gives us useful building blocks:

- JWT + magic-link auth in `src/lib/auth.ts`
- Existing magic-link endpoints in `src/app/api/auth/*`
- Auto-created member users already exist in the GRC claim flow
- Member dashboard shell and auth hook already exist
- Admin tables, pagination, filters, and moderation UI patterns already exist
- Merchant pages already render reviews and photo galleries
- Email sending already exists in `src/lib/email.ts`

Important constraints in the current code:

- Home page is mostly presentation right now, so the sweepstakes CTA can be added cleanly.
- `POST /api/auth/magic-link` currently assumes the user already exists.
- The GRC claim flow already proves we can create a member user automatically before login.
- The current `reviews` table is doing double duty and is not a great fit for sweepstakes testimonials.
- Merchant public pages currently pull reviews without filtering to approved-only status.

## Recommendation

Do not bolt sweepstakes data onto the existing `reviews` flow.

Instead, add a dedicated sweepstakes domain with its own tables and APIs, then bridge approved testimonials into merchant pages and the existing certificate qualification flow.

That keeps these concerns separate:

- GRC bonus reviews during certificate activation
- Public merchant reviews with star ratings
- Sweepstakes favorite-merchant testimonials with monthly limits, 2 required photos, moderation, and rewards

## Lessons From `local-city-eats`

I reviewed the existing sweepstakes implementation in the related `local-city-eats` repo to decide what is worth reusing versus what should stay out of this build.

### Reuse these ideas

- Referral attribution flow and persistent referral code handling
- Monthly-cycle modeling with Phoenix / Arizona time as the source of truth
- Member-facing sweepstakes dashboard patterns:
  - entry counts
  - leaderboard
  - referral link
- Admin-facing winner workflow patterns:
  - cycle summary
  - participant list
  - manual winner selection
  - notification follow-up

### Do not copy these assumptions

- Do not make sweepstakes entry creation depend on approved reviews
- Do not store “3 referral entries” as three duplicate rows with the same event identity
- Do not make the draw logic depend on the current month when admin operations are based on the closed prior month
- Do not mix merchant testimonials into the normal review model

### Translation for `local-city-places`

This campaign is not “reviews plus referrals.”

It is:

- a campaign landing-page entry flow
- daily confirmed entries
- dashboard follow-through
- merchant nomination/testimonial workflow
- moderation and reward qualification / fulfillment
- monthly draw logic with matching winners

That means we should reuse the *referral and admin patterns* from `local-city-eats`, but build a cleaner campaign-specific data model in `local-city-places`.

## Codebase Review Notes

I reviewed the current `local-city-places` app across four areas before expanding this plan:

- campaign landing page and entry form
- auth and magic-link behavior
- member dashboard and nav structure
- admin moderation / merchant-page publishing patterns

Current repo realities that shape the plan:

- The campaign already has a dedicated route at `src/app/(marketing)/favorite-merchant-sweepstakes/page.tsx`
- The current entry form is frontend-only and not wired to backend flow in `src/components/campaigns/favorite-merchant/sweepstakes-entry-form.tsx`
- `POST /api/auth/magic-link` only supports existing users today
- The member dashboard nav has no sweepstakes area yet
- Merchant pages currently render reviews directly from the `reviews` table
- Admin already has established patterns for list moderation, merchant management, image upload, emails, and gift-card operations

## Proposed Data Model

Add a small sweepstakes domain instead of stretching existing tables.

### 1. Monthly cycle table

`sweepstakes_cycles`

- `id`
- `year`
- `month`
- `name`
- `starts_at`
- `ends_at`
- `status` (`open`, `closed`, `drawn`)
- `grand_prize_label` default `"500 in Gas or Groceries"`
- `created_at`
- `updated_at`

Why:

- Gives admin a concrete monthly record to draw from
- Keeps winner history, leaderboard queries, and admin screens clean
- Lets us lock a cycle before drawing winners

### 2. Entry table

`sweepstakes_entries`

- `id`
- `cycle_id`
- `user_id`
- `member_id`
- `entry_name`
- `entry_email`
- `entry_local_date` (Arizona local date)
- `status` (`pending`, `confirmed`, `void`)
- `source` (`homepage`, `dashboard`, `referral`)
- `referral_code_used`
- `confirmed_at`
- `created_at`

Constraints:

- Unique on `user_id + entry_local_date`
- Index on `cycle_id + status`
- Optional unique idempotency key for callback-safe confirmation

Why:

- Supports once-per-day entry
- Preserves the entered name/email snapshot
- Lets us handle pending submission before magic-link confirmation
- Avoids the duplicate-row referral bug seen in the other repo

### 3. Referral relationship

Use a dedicated table instead of trying to infer everything from entries.

`member_referrals`

- `id`
- `referrer_member_id`
- `referred_member_id`
- `referral_code`
- `created_at`

Constraints:

- Unique on `referred_member_id`
- Unique referral code per member

Why:

- Keeps one sponsor chain per member
- Makes first-tier and second-tier matching logic straightforward
- Supports referral links from the dashboard

### 3b. Referral activation events

`sweepstakes_referral_activations`

- `id`
- `cycle_id`
- `referrer_member_id`
- `referred_member_id`
- `activating_entry_id`
- `activated_at`

Constraint:

- Unique on `cycle_id + referrer_member_id + referred_member_id`

Why:

- Separates relationship tracking from cycle-based activation
- Lets the leaderboard count “activated referrals” correctly
- Gives winner logic a clean audit trail for the matching prize component

### 4. Favorite merchant testimonials

`favorite_merchant_testimonials`

- `id`
- `cycle_id`
- `member_id`
- `merchant_id`
- `title` nullable
- `content`
- `word_count`
- `status` (`pending`, `approved`, `rejected`)
- `rejection_reason`
- `approved_at`
- `approved_by`
- `reward_status` (`not_earned`, `registration_required`, `qualifying`, `qualified`, `fulfilled`)
- `reward_reference_id` nullable
- `created_at`
- `updated_at`

Constraints:

- Unique on `member_id + cycle_id + merchant_id`

Business rule:

- Maximum 5 testimonial submissions per member per cycle

### 5. Testimonial photos

`favorite_merchant_testimonial_photos`

- `id`
- `testimonial_id`
- `url`
- `display_order`
- `created_at`

Validation:

- At least 2 photos required before submission

### 6. Monthly draw results

`sweepstakes_winners`

- `id`
- `cycle_id`
- `entry_id`
- `member_id`
- `winner_type` (`grand_prize`, `tier_1_match`, `tier_2_match`)
- `derived_from_entry_id` nullable
- `selected_by`
- `selected_at`
- `notification_status` (`draft`, `sent`, `claimed`)
- `notes`

Why:

- Keeps draw results auditable
- Lets admin re-open or manually manage follow-up

### 7. Optional reward audit table

If we want sweepstakes-specific reporting without replacing the existing qualification flow, add:

`sweepstakes_rewards`

- `id`
- `cycle_id`
- `member_id`
- `source_type` (`testimonial_approval`, `grand_prize`, `tier_1_match`, `tier_2_match`)
- `source_id`
- `reward_type` (`gas_grocery_certificate`, `grand_prize`)
- `amount`
- `status` (`pending`, `sent`, `claimed`, `void`)
- `delivery_method`
- `delivery_reference`
- `created_at`
- `updated_at`

Why:

- Captures sweepstakes-specific reward state without changing the source of truth for qualification
- Gives admin and dashboard a clean audit trail for certificate registration, qualification, and fulfillment

## Auth and Entry Flow

### Recommended flow

1. Visitor submits name + email on the home page.
   For this campaign, that means the dedicated landing page, not replacing the homepage.
2. `POST /api/sweepstakes/enter` validates:
   - valid email
   - active monthly cycle
   - no confirmed entry for this user on today's Arizona date
3. If user does not exist, create a `users` row with role `member`.
4. If member profile does not exist, create a lightweight `members` row immediately.
5. Create a `pending` sweepstakes entry.
6. Send a magic link with a callback that lands back in sweepstakes confirmation.
7. When the magic link is verified, mark the pending entry `confirmed`.
8. Redirect the user to the member dashboard with a sweepstakes welcome state.

## End-To-End User Flow

This section is the plain-English source of truth for how the campaign should feel from the member side.

### 1. Visitor arrives on the campaign page

Entry point:

- `/favorite-merchant-sweepstakes`

The page explains:

- the monthly grand prize
- that entry is allowed once per day
- that Arizona time controls the monthly cutoff
- that referring others can unlock matching prizes
- that the next step after entry is nominating a favorite merchant

### 2. Visitor submits the campaign form

Form fields:

- name
- email
- optional phone
- hidden referral code when `?ref=` is present

On submit, the system:

- validates the active cycle
- validates one entry per Arizona local day
- finds or creates a lightweight `user`
- finds or creates a lightweight `member`
- creates a pending entry
- sends a magic link

### 3. Visitor confirms through magic link

When the visitor clicks the magic link:

- auth verification runs through the existing login flow
- the pending daily entry is marked confirmed
- the member is signed in
- the member lands in the member dashboard with sweepstakes context visible

The goal is:

- no detour into the long GRC onboarding flow
- no confusion about whether the entry counted

### 4. Member lands in dashboard

The member should immediately see:

- today’s entry status
- this month’s confirmed entries
- activated referrals
- referral link with copy button
- testimonial quota remaining
- a clear CTA to nominate a favorite merchant

This is the moment where the campaign changes from “lead capture” into “member participation.”

### 5. Member shares their referral link

The member can copy a personal referral link from the dashboard.

When another person enters through that link:

- the referral code is preserved
- the referred person gets their own daily-entry confirmation flow
- once that referred member has a confirmed campaign entry, the referrer counts an activated referral for leaderboard purposes

### 6. Member starts a favorite-merchant nomination

Route recommendation:

- `/member/sweepstakes/testimonials/new`

The member uses a dedicated form to:

- search for a merchant using Google Places autocomplete
- match to an existing merchant record when possible
- or create a pending merchant candidate if not yet in the database
- write at least 50 words
- upload at least 2 photos
- submit the nomination for moderation

### 7. Nomination enters admin moderation

After submission, the member sees the nomination status in their dashboard history.

Possible statuses:

- draft
- submitted
- changes requested
- approved
- rejected

If changes are requested:

- the member can revise and resubmit

If approved:

- the testimonial becomes eligible for public merchant-page display
- the member becomes eligible to start the $25 certificate qualification flow

### 8. Approved nomination is published publicly

Once approved:

- the content appears on the merchant’s public page
- it renders in a dedicated `Nominated As A Favorite Merchant` section
- it stays separate from normal reviews and review aggregates

If the merchant came from Google Places and was not already in the database:

- admin must resolve that place into a real local merchant record before public display

### 9. Member starts the $25 certificate process after approval

After approval:

- the member sees a new dashboard state for the approved testimonial reward
- the member must choose the program option and store required by the certificate flow
- the member follows the standard qualification process before the $25 certificate is sent
- admin can track whether the reward is awaiting registration, qualifying, qualified, sent, claimed, or needs follow-up

Important:

- Troy confirmed the $25 certificate still follows the normal qualification logic
- that includes the typical $100 in monthly receipts before the reward is actually sent
- the member must pick the store they will shop at as part of that process
- gas is now in scope too, but the exact gas-specific mechanics should be documented after a follow-up walkthrough with Troy

### 10. Monthly draw happens after cycle close

At the end of the Arizona monthly cycle:

- admin closes or locks the cycle
- the grand-prize winner is selected from eligible confirmed entries for that closed cycle
- the winner chain is calculated from stable referral relationships

Winner types:

- grand prize winner
- tier 1 matching winner: the direct referrer of the grand-prize winner
- tier 2 matching winner: the referrer of the tier 1 winner

### 11. Admin notifies winners and manages claims

Admin can then:

- send winner emails
- resend notifications if needed
- track claim progress
- track fulfillment progress

The monthly winner flow should always be auditable:

- which cycle
- which entry won
- who the matching winners were
- who sent notifications
- what reward / prize status each winner is in

### Existing patterns to reuse in `local-city-places`

The current codebase already has the right primitives for this campaign flow:

- existing magic-link send endpoint:
  - `src/app/api/auth/magic-link/route.ts`
- existing magic-link verification and redirect logic:
  - `src/app/api/auth/verify/route.ts`
- existing session hydration with user + member profile lookup:
  - `src/lib/auth.ts`
- existing “find or create a member user first, complete profile later” precedent:
  - `src/app/api/grc/[grcId]/claim/route.ts`
- existing member registration endpoint for completing a full profile:
  - `src/app/api/member/register/route.ts`
- existing member dashboard layout and navigation:
  - `src/app/(dashboard)/member/nav.ts`
  - `src/app/(dashboard)/member/page.tsx`
  - `src/app/api/member/dashboard/route.ts`

### Key blocker in the current auth flow

Today, `POST /api/auth/magic-link` only works for an already-existing user.

That means the sweepstakes campaign cannot just submit an email and send a link. The campaign entry endpoint must:

- find existing user by email, or
- create a lightweight `users` row first,
- optionally create a lightweight `members` row immediately,
- then call the existing magic-link machinery

This is the single most important auth change for the campaign.

### Recommended member-account strategy

For this campaign, create both of these immediately at entry time:

- lightweight `users` row with role `member`
- lightweight `members` row with only the minimum safe fields required for dashboard access

Why this is better than the current default onboarding path:

- the current verify route sends members without a profile to `/member/register`
- for sweepstakes, that creates the wrong first-run experience
- the campaign promise is:
  - enter
  - confirm
  - land in dashboard
  - copy referral link
  - submit favorite-merchant nomination

If we do not create the lightweight member row up front, the user gets redirected into the long GRC-style registration flow instead of the sweepstakes dashboard.

### Recommended verify-callback behavior

Do not fork the entire auth system.

Keep using:

- `createMagicLinkToken(...)`
- `/api/auth/verify`
- `getSession()`

But add campaign-aware callback handling:

1. Entry API creates a pending sweepstakes entry and passes a callback URL such as:
   - `/member?sweepstakes=confirmed&entry=<id>`
2. Verify route sets the session cookie as it does today.
3. Before redirecting, verify route (or a follow-on confirmation endpoint it calls) confirms the pending entry associated with that callback context.
4. The user lands directly in the member dashboard with the sweepstakes CTA and referral state visible.

Implementation note:

- avoid putting too much business state in the raw callback URL
- safer pattern:
  - callback carries a short opaque identifier
  - server resolves it to the pending sweepstakes entry

### Recommended entry endpoint responsibilities

`POST /api/sweepstakes/enter`

Should do all of the following in one transaction-safe flow:

- normalize first name, last name, email, optional phone, optional referral code
- validate active cycle in Arizona time
- enforce one entry per Arizona local day
- find or create `users`
- find or create lightweight `members`
- attach referral relationship if appropriate
- create pending sweepstakes entry
- create magic-link token with campaign callback
- send magic-link email
- return a generic success response

### Member entry form plan

The current landing-page form already exists as a frontend shell:

- `src/components/campaigns/favorite-merchant/sweepstakes-entry-form.tsx`

Wire it in this order:

1. Keep `firstName`, `lastName`, `email`, optional `phone`, and referral code
2. Parse `?ref=` from the campaign URL and prefill `referredBy`
3. Submit to `POST /api/sweepstakes/enter`
4. Swap the current preview state for a real “check your email” confirmation state
5. Preserve conversion copy:
   - daily entry rule
   - Arizona monthly cutoff
   - dashboard follow-through

Phone handling should follow existing project rules:

- UI format `(XXX) XXX-XXXX`
- store digits only

### Dashboard placement plan

Do not create a separate member app for sweepstakes.

Reuse the existing member dashboard shell and navigation. Add:

- a top-level member nav item such as `Sweepstakes`, or
- a first-class dashboard module on `/member` plus a dedicated detail page like `/member/sweepstakes`

Recommended approach:

- Phase 1:
  - add a strong sweepstakes card/module on `/member`
- Phase 2:
  - add `/member/sweepstakes`
  - add nav item once the feature has enough depth

Why:

- faster to ship
- avoids bloating the nav before the flow is functional
- keeps the first confirmed visit focused on a single next step

### Dashboard module content

Once confirmed through the magic link, the member dashboard should show:

- today’s entry status
- current cycle entry count
- activated referrals count
- personal referral link with copy button
- testimonial quota remaining this month
- next-step CTA:
  - `Nominate Your Favorite Merchant`

### What not to reuse from current member onboarding

Do not reuse the current full member registration wizard as the post-confirmation default for sweepstakes users.

That wizard is designed for GRC participation and includes:

- personal info collection
- grocery store selection
- survey handling
- review offer
- start date logic

Those are not the right first steps for sweepstakes entrants.

### Entry source recommendation

Use a dedicated campaign route such as:

- `/favorite-merchant-sweepstakes`

This route should:

- preserve the main homepage
- support referral param capture
- become the primary paid/social/email campaign destination
- focus above-the-fold on:
- prize
- daily entry simplicity
- matching-prize explanation
- post-entry next step

## Member Forms And Route Plan

The campaign needs more than one form. Breaking the flow into purpose-specific forms will keep validation and messaging much cleaner.

### Public campaign form

Route:

- `/favorite-merchant-sweepstakes`

Component base:

- `src/components/campaigns/favorite-merchant/sweepstakes-entry-form.tsx`

Fields:

- first name
- last name
- email
- phone optional
- referral code hidden or visible when present

Behavior:

- submit to `POST /api/sweepstakes/enter`
- create or reuse lightweight user + member
- create pending daily entry
- send magic link
- show confirmation state that explains the email step

### Magic-link confirmation return

Recommended callback route:

- `/favorite-merchant-sweepstakes/confirmed`

Behavior:

- consume magic-link verification result
- confirm the pending sweepstakes entry
- if member profile is lightweight but valid, redirect to `/member?sweepstakes=welcome`
- preserve campaign attribution in session or callback params

### Member sweepstakes dashboard area

Recommended new routes:

- `/member/sweepstakes`
- `/member/sweepstakes/testimonials`
- `/member/sweepstakes/rewards`

Recommended member nav additions:

- `Sweepstakes`
- `Testimonials`
- `Rewards` optional if rewards become a standalone screen

### Favorite merchant testimonial form

Recommended route:

- `/member/sweepstakes/testimonials/new`

Fields:

- merchant picker
- merchant city/state display
- testimonial title optional
- testimonial body required, 50+ words
- photo uploader with minimum 2 photos
- referral reminder / dashboard context, not part of payload

Validation:

- max 5 submissions per member per calendar month
- one submission per merchant per cycle
- cannot submit until current cycle entry is confirmed

### Merchant autocomplete recommendation

Use Google Places autocomplete for the testimonial merchant picker.

Why:

- faster member experience than typing exact merchant names
- reduces duplicate merchant spellings
- improves city/state accuracy
- creates a path for adding missing merchants without making the form feel broken

Recommended flow:

1. Member starts typing a merchant name.
2. Google Places autocomplete returns likely matches.
3. If the place already maps to an existing merchant in our database, select that merchant.
4. If it does not exist yet, create a pending merchant candidate record or lightweight merchant draft for admin review.
5. The testimonial stays linked to:
   - existing `merchantId`, or
   - pending `placeId` / merchant candidate until admin resolves it.

Recommended data to capture from Places:

- `placeId`
- merchant name
- formatted address
- city
- state
- latitude / longitude if available
- website and phone only if already part of the normal merchant ingestion path

Implementation note:

- prefer a hybrid model:
  - autocomplete from Google Places
  - but store and render against local merchant records
- do not render merchant pages directly from raw Google Places payloads

Fallback UX:

- if no exact merchant exists, allow:
  - `Use this business`
  - create pending merchant candidate
  - show the member that admin may review the merchant before the nomination is published

### Testimonial detail / edit state

Recommended route:

- `/member/sweepstakes/testimonials/[id]`

Behavior:

- show moderation state
- show approved / rejected reason
- allow editing only while in `draft` or `changes_requested`
- show reward status after approval

### Why create the member row up front

The current auth verifier redirects member users without a member profile to `/member/register`.

For sweepstakes, that is not the desired first-run experience. Creating a lightweight member profile up front allows:

- immediate dashboard access
- a referral link right away
- testimonial submission without a second onboarding wall

## Referral Logic

Each member gets a stable referral code and link, for example:

`/` with `?ref=ABC123`

Behavior:

- Home page stores the referral code during entry
- On successful confirmation, if the new member has no existing referrer, create a `member_referrals` row
- If a referred user later wins the grand prize:
  - direct referrer gets a `tier_1_match` winner record
  - the referrer's referrer gets a `tier_2_match` winner record

Activated referral definition for leaderboard:

- a referred member with at least one confirmed sweepstakes entry

Matching prize winner logic:

- `grand_prize`: the selected winning entrant
- `tier_1_match`: the member who directly referred the grand-prize winner
- `tier_2_match`: the member who referred the tier-1 winner

Important implementation note:

- calculate matching winners from the stable referral relationship
- do not infer winner tiers from duplicated entry rows

## Member Experience

### Home page

Add a dedicated sweepstakes entry module to the marketing home page:

- name field
- email field
- copy for daily entry rules
- copy for Arizona monthly deadline
- hidden referral state if `ref` is present

### Dashboard

Add a new sweepstakes area to the member experience.

Suggested nav additions:

- `Sweepstakes`
- `Testimonials`
- `Rewards` if reward delivery becomes its own flow

Recommended rollout:

- first ship a dashboard card on `/member`
- then add `Sweepstakes`
- then split out `Testimonials` and `Rewards` only when the surface area justifies new pages

Sweepstakes dashboard should show:

- today's entry status
- this month's confirmed entry count
- activated referrals
- testimonial quota remaining this month
- personal referral link with copy button
- lightweight leaderboard
- next-step card: "Nominate your favorite merchant"

Implementation note:

- the current member dashboard at `src/app/(dashboard)/member/page.tsx` is heavily GRC-oriented
- do not overload that page with the full testimonial workflow
- add a dashboard card there first, then move deeper sweepstakes tasks into dedicated subroutes

### Testimonial submission

Create a dedicated member submission flow, not the current review form.

Requirements:

- merchant picker
- minimum 50 words
- minimum 2 photos
- max 5 merchant nominations per calendar month
- one nomination per merchant per month
- status messaging after submission

Recommended moderation statuses:

- `draft`
- `submitted`
- `approved`
- `rejected`
- `changes_requested`

Recommended member experience after approval:

- show the nomination in dashboard history
- show reward registration / qualification / claim state
- link to the merchant page once posted publicly

Why this should stay separate from reviews:

- the current `reviews` table is tied to merchant review display and GRC-related review creation
- merchant pages and merchant dashboards already assume `reviews` means standard review content
- favorite-merchant nominations need different validation, moderation, quota logic, and public presentation

## Admin Experience

Add a dedicated admin area instead of folding this into existing review moderation.

Suggested routes:

- `/admin/sweepstakes`
- `/admin/sweepstakes/entries`
- `/admin/sweepstakes/testimonials`
- `/admin/sweepstakes/winners`

Admin needs:

- current cycle summary
- entries table with confirmed/pending counts
- referral leaderboard
- testimonial moderation queue
- winner-draw action for the cycle
- winner detail view with referral-chain winners
- email send actions for grand prize and matching winners
- testimonial reward qualification / fulfillment controls

Recommended admin routes:

- `/admin/sweepstakes`
- `/admin/sweepstakes/entries`
- `/admin/sweepstakes/testimonials`
- `/admin/sweepstakes/testimonials/[id]`
- `/admin/sweepstakes/winners`

Recommended admin form/actions:

- approve testimonial
- reject testimonial with reason
- request changes
- move reward into qualification / fulfillment follow-up
- send / resend winner emails
- lock cycle and run draw

Use the same patterns already used in admin reviews, admin receipts, and admin users:

- server-side pagination
- search
- status filters
- compact stats cards
- desktop table plus mobile cards

## Merchant Page Changes

Add a second public content section:

- `Nominated As A Favorite Merchant`

Keep it separate from the existing `Reviews` section.

That section should only show approved sweepstakes testimonials and their photos.

This is also a good time to tighten the current public review query so only approved public reviews render.

Public-site integration recommendation:

- keep standard customer reviews in the existing `Reviews` section
- add a distinct testimonial section for approved campaign content
- do not merge favorite-merchant nominations into aggregate review counts or star-rating logic

Recommended public query split:

- `getMerchantReviews(merchantId)` for standard reviews only
- `getFavoriteMerchantTestimonials(merchantId)` for approved campaign nominations only

If Google Places is used in the member form:

- merchant-page publishing must resolve to a real local merchant record before public display
- pending merchant candidates should never render publicly until approved / linked

Recommended merchant page section order:

1. merchant hero / details
2. nominated as a favorite merchant
3. reviews
4. gallery / supporting content

This gives the campaign content a visible place without corrupting the semantics of normal reviews.

## Reward Delivery

This area now has a clearer product direction.

Troy confirmed that the `$25` testimonial certificate should follow the same basic qualification path members already use today:

1. A testimonial is approved.
2. The member starts the certificate registration flow from their dashboard.
3. The member chooses the store they will shop at.
4. The member completes the usual qualification requirement, including the standard `$100` in monthly receipts before the reward is sent.
5. Admin fulfillment sends the certificate after qualification is complete.

Gas is now in scope too. The plan should treat gas as part of the same reward family, but the exact gas-specific registration and qualification mechanics still need a follow-up walkthrough with Troy before implementation details are locked.

### What the current codebase does today

The existing `$25` reward flow is not a generic reward system.

It currently works like this:

1. A merchant issues a GRC.
2. A member claims and activates that GRC.
3. The member must choose a grocery store during GRC activation.
4. That grocery store is then effectively locked for the life of the GRC.
5. The member uploads receipts from that store.
6. Admin approves receipts and the system updates a monthly qualification record.
7. Once the member reaches the qualification threshold and completes any required survey, that monthly qualification becomes `qualified`.
8. Admin gift-card fulfillment works off `monthly_qualifications` records with status `qualified`.

Important implication:

- the current admin gift-card queue is really a GRC monthly qualification queue
- it is not a standalone reward ledger
- it should remain the source of truth for when the sweepstakes `$25` certificate is actually ready to send

This means the sweepstakes reward should plug into the existing qualification lifecycle rather than bypass it.

### Confirmed sweepstakes adaptation

- testimonial approval should unlock the certificate process, not mark the reward as delivered
- the member dashboard should show a post-approval step to register the reward
- the chosen store must be captured before qualification begins
- the member must complete the normal receipt-based qualification before admin sends the `$25` certificate
- admin moderation status and reward qualification status should stay separate

For grocery:

- reuse the current store-selection pattern
- assume the selected store is then locked for that certificate lifecycle unless product says otherwise

For gas:

- keep the same high-level dashboard flow
- document the exact place-picker, validation, and qualification behavior after Troy's walkthrough

### Implementation recommendation

- Reuse the existing GRC qualification pipeline for the testimonial `$25` certificate where practical.
- Add a campaign/source marker so the reward can be traced back to the approved testimonial.
- Add dashboard UI for the post-approval registration step.
- If extra reporting is needed, use a thin sweepstakes reward audit record, but do not make it the source of truth for qualification or fulfillment.
- Keep grand prize and matching prize tracking separate from the testimonial certificate qualification flow.

### Follow-up details to lock down

- how the gas option is represented in the data model
- whether gas uses the same `$100` threshold or a parallel rule set
- whether gas selection uses Google Places, a curated location list, or a different validation path
- whether the testimonial reward creates a campaign-linked GRC record directly or a small wrapper that points into the existing qualification tables

## API Plan

### Public

- `POST /api/sweepstakes/enter`
- `GET /api/sweepstakes/leaderboard`
- `GET /api/sweepstakes/cycle`

### Auth callback support

- reuse `/api/auth/verify`
- add sweepstakes callback handling so pending entries become confirmed after login

### Member

- `GET /api/member/sweepstakes/dashboard`
- `GET /api/member/sweepstakes/testimonials`
- `POST /api/member/sweepstakes/testimonials`
- `POST /api/member/sweepstakes/testimonials/upload`
- `GET /api/member/sweepstakes/referrals`
- `GET /api/member/sweepstakes/rewards`
- `PUT /api/member/sweepstakes/testimonials/[id]`
- `GET /api/member/sweepstakes/merchant-search`

### Admin

- `GET /api/admin/sweepstakes/entries`
- `GET /api/admin/sweepstakes/testimonials`
- `PUT /api/admin/sweepstakes/testimonials/[id]`
- `POST /api/admin/sweepstakes/cycles/[id]/draw`
- `POST /api/admin/sweepstakes/winners/[id]/notify`
- `POST /api/admin/sweepstakes/testimonials/[id]/reward`

## Suggested Build Order

### Phase 1: sweepstakes foundation

- add schema and migration
- add monthly cycle helpers using `America/Phoenix`
- add entry API
- auto-create user/member on entry
- send magic link with sweepstakes callback
- confirm entries after verification
- add campaign route and landing-page form wiring
- add dashboard success state for newly confirmed entrants

### Phase 2: member sweepstakes dashboard

- add member nav item
- add dashboard API
- show entries, referrals, referral link, leaderboard, testimonial quota
- add a simple nomination CTA and empty-state flow

### Phase 3: testimonial system

- add testimonial tables and photo uploads
- add member submission UI
- add Google Places merchant autocomplete
- add merchant candidate resolution flow for unmatched places
- add admin moderation UI
- add merchant page section for approved testimonials

### Phase 4: winner draw and admin operations

- add monthly draw logic
- calculate tier-1 and tier-2 winners
- add winner management UI
- add notification emails
- make winner selection operate on the closed cycle, not the active one

### Phase 5: reward certificate delivery

- choose reward model
- issue reward on approved testimonial
- surface reward in dashboard

## Concrete First Implementation Slice

If we want to move fast without painting ourselves into a corner, build this slice next:

### Backend

- add `sweepstakes_cycles`
- add `sweepstakes_entries`
- add `member_referrals`
- add `sweepstakes_referral_activations`
- seed the current open monthly cycle
- build `POST /api/sweepstakes/enter`
- update magic-link verification flow to confirm the pending entry

### Frontend

- wire the new campaign landing page form to the real API
- preserve `?ref=` through entry and verification
- add a basic sweepstakes dashboard card:
  - today’s entry state
  - monthly confirmed entries
  - referral link
  - activated referral count

### Member UX after first slice

The first slice should still give the member a coherent experience:

- submit campaign form
- receive magic link
- land in member dashboard with a visible sweepstakes card
- see “next step: nominate your favorite merchant”
- copy referral link immediately

### Admin

- add a minimal admin sweepstakes overview page:
  - current cycle
  - pending vs confirmed entries
  - activated referrals
  - top entrants

This slice gives us a real campaign system end to end before we add nomination uploads, moderation, and rewards.

## Review Pass Plan

Before implementation starts, review the plan from these separate lenses:

### Pass 1: auth and entry

Check:

- can the entry endpoint create a new user safely
- can it create a lightweight member safely
- can verify callback confirm the pending entry without open-redirect risk
- can daily entry limits be enforced in Arizona time

### Pass 2: member dashboard and forms

Check:

- confirmed entrants land in the right place
- the member dashboard has a clear next step
- the nomination form is separate from GRC registration
- referral link visibility is immediate

### Pass 3: admin and moderation

Check:

- testimonial moderation is separate from reviews
- admin can see pending entries and pending nominations
- winner calculation uses stable referral relationships
- reward qualification and fulfillment are auditable

### Pass 4: public merchant experience

Check:

- approved nominations render separately from reviews
- merchant pages do not expose unapproved content
- public copy uses campaign language, not internal moderation terms

## Open Decisions

These are the only items I would want confirmed before implementation starts:

1. Should we create lightweight member profiles automatically for every sweepstakes entry, or should a first-time entrant still complete profile registration later?
2. Is an "activated referral" defined as "confirmed sweepstakes entry" or something stricter?
3. Should rejected testimonials count against the 5-per-month cap, or should members be allowed to revise and resubmit the same slot?
4. What are the exact gas-specific registration, place selection, and qualification rules Troy wants us to mirror?

## Review Passes

This plan should be reviewed at multiple checkpoints, not just once up front.

### Pass 1: architecture review

Focus:

- data model separation from `reviews`
- magic-link confirmation strategy
- referral graph correctness
- cycle boundaries in Arizona time

### Pass 2: member flow review

Focus:

- landing-page conversion
- confirmation UX
- dashboard next-step clarity
- testimonial submission friction

### Pass 3: admin operations review

Focus:

- moderation queue usability
- draw workflow
- winner auditability
- reward fulfillment handling

### Pass 4: public merchant-page review

Focus:

- testimonial section placement
- distinction between testimonials and reviews
- moderation visibility guarantees
- cache / revalidation behavior after approval

## Recommended First Slice

If we want the safest first implementation, start here:

1. Add sweepstakes cycle + entry + referral tables.
2. Build `POST /api/sweepstakes/enter`.
3. Auto-create user/member and confirm entries through magic-link verification.
4. Wire the separate campaign landing page entry form.
5. Add a basic member sweepstakes dashboard card with referral link and entry counts.

That gives you a real, testable entry system quickly while leaving testimonials, moderation, rewards, and winner operations to the next slice.
