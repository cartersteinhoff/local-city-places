# Admin Merchant Page Creation with Vimeo Embed - Functional Requirements Document

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Status** | Active |
| **Author** | Admin |
| **PRD Link** | N/A |
| **Created** | 2026-02-02 |
| **Last Updated** | 2026-02-02 |

---

## Overview

Enable admins to create public Merchant Pages directly from the 2.0 Admin interface, with the ability to embed Vimeo music videos. These pages will be accessible via SEO-friendly URLs and phone-number-based short codes.

---

## Functional Requirements

### FR-1: Admin Create Merchant Page
**Description:** Admins can create merchant pages with business information and optional Vimeo video embed
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] Admin can access create form at `/admin/merchants/create`
- [ ] Google Places autocomplete populates business fields
- [ ] Manual entry available as fallback
- [ ] Form validates required fields (Business Name, City/State, Phone)
- [ ] Vimeo URL is validated and video ID extracted
- [ ] SEO-friendly slug generated from business name

### FR-2: Vimeo Video Embed
**Description:** Merchant pages can display embedded Vimeo videos
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] Vimeo URL field accepts standard formats (`vimeo.com/123` and `player.vimeo.com/video/123`)
- [ ] Video ID extracted via regex
- [ ] Responsive 16:9 iframe embed displayed on merchant page
- [ ] Video section hidden when no URL provided

### FR-3: Public Merchant Page
**Description:** SEO-friendly public pages displaying merchant information
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] Pages accessible at `/business/[city]/[state]/[slug]` (e.g., `/business/denver/co/cobblestone-auto-spa-abc123`)
- [ ] Header section with placeholder gradient and business info
- [ ] Clickable phone (tel: link) and website (external link)
- [ ] Vimeo video embed when available
- [ ] Reviews section placeholder for future integration

### FR-4: Short Code URL System
**Description:** Phone number-based short URLs for easy sharing
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] `/[phoneNumber]` redirects to full SEO URL (e.g., `/4255779060`)
- [ ] Phone number lookup uses digits only (10 digits)
- [ ] Redirect to full business URL
- [ ] 404 page for non-existent merchants

### FR-5: Admin Merchant List
**Description:** Admin can view and manage all merchant pages
**Priority:** Must Have
**Acceptance Criteria:**
- [ ] List view at `/admin/merchants` shows all merchant pages
- [ ] Edit functionality for all fields
- [ ] Delete functionality with confirmation
- [ ] Links to public page and short URL

---

## Non-Functional Requirements

### Performance
- Public merchant pages should load in under 2 seconds
- Vimeo embed should lazy load

### Security
- Admin endpoints require admin role authentication
- Public pages are accessible without authentication
- No sensitive business data exposed on public pages

### Scalability
- Slug uniqueness ensured via short ID suffix
- Phone number lookup indexed for fast redirects

---

## Data Model

### Merchants Table (Additions)
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| vimeoUrl | text | Yes | Full Vimeo URL for video embed |
| slug | varchar(255) | Yes | SEO-friendly slug (business-name-abc123) |
| isPublicPage | boolean | Yes | Distinguishes "page only" merchants (default: false) |

### URL Generation
```typescript
// Full SEO URL
function getMerchantPageUrl(city: string, state: string, slug: string): string {
  const citySlug = slugify(city);
  const stateSlug = state.toLowerCase();
  return `/business/${citySlug}/${stateSlug}/${slug}`;
}

// Short code URL (phone number at root)
function getMerchantShortUrl(phone: string): string {
  return `/${stripPhoneNumber(phone)}`;
}
```

---

## API Specifications

### Create Merchant Page
**Endpoint:** `POST /api/admin/merchant-pages`
**Auth:** Admin Required
**Description:** Creates a new merchant page

**Request:**
```json
{
  "businessName": "Cobblestone Auto Spa",
  "city": "Denver",
  "state": "CO",
  "phone": "3035551234",
  "website": "https://cobblestoneautospa.com",
  "categoryId": "uuid",
  "description": "Premium auto detailing...",
  "vimeoUrl": "https://vimeo.com/1160781582",
  "googlePlaceId": "ChIJ..."
}
```

**Response (200):**
```json
{
  "success": true,
  "merchant": { "id": "...", "businessName": "...", "slug": "..." },
  "urls": {
    "full": "/denver/co/cobblestone-auto-spa-abc123",
    "short": "/m/3035551234"
  }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| 400 | Missing required fields or invalid Vimeo URL |
| 401 | Unauthorized (not admin) |

### List Merchant Pages
**Endpoint:** `GET /api/admin/merchant-pages`
**Auth:** Admin Required
**Description:** Lists all merchant pages with pagination

**Response (200):**
```json
{
  "merchants": [...],
  "pagination": { "total": 50, "page": 1, "limit": 20, "totalPages": 3 }
}
```

### Get/Update/Delete Merchant Page
**Endpoint:** `GET/PATCH/DELETE /api/admin/merchant-pages/[id]`
**Auth:** Admin Required

### Get Public Merchant Page
**Endpoint:** `GET /api/merchants/public/[slug]`
**Auth:** Public
**Description:** Returns merchant data for public page rendering

---

## UI/UX Specifications

### Admin Create Page
**Route:** `/admin/merchants/create`
**Access:** Admin only

**Key Elements:**
- Google Places Autocomplete (reuse existing component)
- Form fields: Business Name, City/State, Phone, Website, Category, Description, Vimeo URL
- Manual entry toggle for businesses not in Google Places
- Submit button with loading state

**User Flow:**
1. Admin types business name in autocomplete
2. System shows Google Places suggestions
3. Admin selects business, fields auto-populate
4. Admin optionally adds Vimeo URL
5. Admin submits form
6. System creates merchant and shows success with URLs

### Admin List Page
**Route:** `/admin/merchants`
**Access:** Admin only

**Key Elements:**
- Table with columns: Business, Location, Phone, Created, Actions
- Search input for filtering
- Edit/Delete action buttons
- "Create Merchant Page" button

### Public Merchant Page
**Route:** `/[city]/[state]/[slug]`
**Access:** Public

**Key Elements:**
- Header: Gradient background, business logo/initials, name, location
- Contact: Clickable phone and website links
- Video: Responsive Vimeo embed (if URL provided)
- About: Business description
- Reviews: Placeholder for future

### Form Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Business Name | text | Yes | Auto-filled from Google Places or manual |
| City, State | text | Yes | Combined UI field (e.g., "Denver, CO"), stored separately |
| Phone | tel | Yes | Format: `(XXX) XXX-XXXX`, stored as digits only |
| Website | url | No | Auto-filled from Google Places |
| Category | select | No | Dropdown from existing categories |
| Description | textarea | No | Business description |
| Vimeo Video URL | url | No | Full Vimeo URL (e.g., `https://vimeo.com/1160781582`) |
| Google Place ID | hidden | No | Stored for reference |

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Business not in Google Places | Admin uses manual entry fallback |
| Invalid Vimeo URL | Form shows validation error, prevents submit |
| Duplicate phone number | Allow (different businesses can share phone) |
| Merchant with no phone | Cannot use short code URL, only SEO URL available |
| Special characters in business name | Slugify removes/replaces appropriately |
| Very long business name | Truncate slug at reasonable length |

---

## Acceptance Criteria

- [ ] All functional requirements implemented
- [ ] Database schema updated with new fields
- [ ] Admin can create merchant pages via form
- [ ] Google Places autocomplete works for business lookup
- [ ] Vimeo URLs are validated and embedded correctly
- [ ] Public pages are accessible and SEO-friendly
- [ ] Short code redirects work correctly
- [ ] Admin nav includes "Merchant Pages" item
- [ ] Error states have user-friendly messages

---

## Technical Notes

### Implementation Approach
- Reuse existing `GooglePlacesAutocomplete` component with `types: ["establishment"]`
- Create Vimeo utility functions in `/src/lib/vimeo.ts`
- Use Next.js dynamic routes for public pages
- Server-side redirect for short code URLs

### Vimeo URL Parsing
```typescript
// Extract video ID from Vimeo URL
const VIMEO_REGEX = /vimeo\.com\/(?:video\/)?(\d+)/;

function extractVimeoId(url: string): string | null {
  const match = url.match(VIMEO_REGEX);
  return match ? match[1] : null;
}

function isValidVimeoUrl(url: string): boolean {
  return VIMEO_REGEX.test(url);
}
```

### Key Files
| File | Purpose |
|------|---------|
| `/src/db/schema.ts` | Add vimeoUrl, slug, isPublicPage fields (userId now nullable) |
| `/src/app/admin/nav.ts` | Add "Merchant Pages" nav item |
| `/src/app/admin/merchants/page.tsx` | List all merchant pages |
| `/src/app/admin/merchants/create/page.tsx` | Create merchant page form |
| `/src/app/admin/merchants/[id]/edit/page.tsx` | Edit merchant page form |
| `/src/app/api/admin/merchant-pages/route.ts` | Create/list merchant pages API |
| `/src/app/api/admin/merchant-pages/[id]/route.ts` | Get/update/delete merchant page API |
| `/src/app/business/[city]/[state]/[slug]/page.tsx` | Public merchant page |
| `/src/app/api/merchants/public/[slug]/route.ts` | Public merchant data API |
| `/src/app/[phoneNumber]/page.tsx` | Phone number redirect (e.g., /4255779060) |
| `/src/lib/vimeo.ts` | Vimeo URL parsing utilities |
| `/src/lib/utils.ts` | Slug generation and URL helpers |
| `/src/components/merchant-page/vimeo-embed.tsx` | Vimeo player component |
| `/src/components/merchant-page/merchant-header.tsx` | Header with placeholder |
| `/src/components/merchant-page/merchant-info.tsx` | Contact/about sections |

---

## Implementation Phases

### Phase 1: Database & Schema
1. Add `vimeoUrl`, `slug`, `isPublicPage` fields to merchants table
2. Run migration

### Phase 2: Vimeo Utilities
1. Create `/src/lib/vimeo.ts` with URL parsing functions
2. Create `/src/components/merchant-page/vimeo-embed.tsx` component

### Phase 3: Admin Create Page
1. Create `/src/app/admin/merchants/create/page.tsx`
2. Reuse Google Places autocomplete from existing components
3. Add form with all fields including Vimeo URL
4. Create `POST /api/admin/merchant-pages` endpoint
5. Add navigation item to admin nav

### Phase 4: Public Merchant Page
1. Create `/src/app/[city]/[state]/[slug]/page.tsx`
2. Create merchant page components (header, info, video embed)
3. Create `GET /api/merchants/public/[slug]` endpoint
4. Implement placeholder header

### Phase 5: Short Code Redirect
1. Create `/src/app/m/[shortCode]/page.tsx`
2. Implement phone number lookup and redirect

### Phase 6: Admin List Page
1. Create `/src/app/admin/merchants/page.tsx` to list all merchant pages
2. Add edit/delete functionality

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-02 | Admin | Initial draft |
