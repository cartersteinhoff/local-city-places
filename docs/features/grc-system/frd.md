# GRC (Gift Receipt Card) System - Functional Requirements Document

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Status** | Complete |
| **Author** | Local City Places Team |
| **PRD Link** | [GRC System PRD](./prd.md) |
| **Created** | 2024-01-01 |
| **Last Updated** | 2024-12-17 |

---

## Overview

The GRC system enables merchants to purchase gift certificate inventory in bulk and issue individual certificates to customers. The system tracks inventory through a two-table architecture: `grcPurchases` for inventory orders and `grcs` for issued certificates.

**Critical Design Rule:** GRC records are ONLY created when issued to a customer, never pre-created at purchase approval time.

---

## Functional Requirements

### FR-1: Merchant Inventory Purchase
**Description:** Merchants can purchase GRC inventory by denomination and quantity
**Priority:** Must Have
**Acceptance Criteria:**
- [x] Select denomination ($50-$500 in predefined tiers)
- [x] Select quantity (1-100 per denomination)
- [x] Choose payment method (Zelle or Business Check)
- [x] Submit order creating `grcPurchases` record with status "pending"
- [x] Display payment instructions based on method selected

### FR-2: Admin Payment Approval
**Description:** Admins verify and approve merchant payments
**Priority:** Must Have
**Acceptance Criteria:**
- [x] List pending purchase orders with merchant details
- [x] View payment method details (Zelle account or check image)
- [x] Approve order (sets paymentStatus to "confirmed")
- [x] Reject order (sets paymentStatus to "failed")
- [x] Approved inventory becomes available for issuance

### FR-3: GRC Issuance
**Description:** Merchants issue individual GRCs to customers
**Priority:** Must Have
**Acceptance Criteria:**
- [x] Enter customer email and select denomination
- [x] System validates available inventory before issuance
- [x] Creates `grcs` record linked to customer
- [x] Sends claim email to customer
- [x] Decrements available inventory

### FR-4: Inventory Tracking
**Description:** Real-time inventory calculation per merchant per denomination
**Priority:** Must Have
**Acceptance Criteria:**
- [x] Display available quantity per denomination
- [x] Calculation: `sum(confirmed purchases) - count(issued grcs)`
- [x] Block issuance if insufficient inventory

---

## Non-Functional Requirements

### Performance
- Inventory calculation must complete in <100ms
- Purchase order list must load in <500ms

### Security
- Merchants can only access their own inventory
- Admin endpoints require admin role
- GRC claim links are unique and non-guessable (UUID-based)

### Scalability
- Support up to 1000 merchants
- Support up to 100,000 issued GRCs

---

## Data Model

### `grcPurchases` (Inventory Tracking)
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| merchantId | uuid | No | FK to merchants |
| denomination | integer | No | Certificate value ($50-$500) |
| quantity | integer | No | Number of certificates purchased |
| totalCost | decimal | No | denomination × quantity × price_per_cert |
| paymentMethod | enum | No | "zelle" or "business_check" |
| paymentStatus | enum | No | "pending", "confirmed", "failed" |
| zelleAccountName | varchar | Yes | For Zelle identification |
| paymentConfirmedBy | uuid | Yes | FK to admin user who approved |
| paymentConfirmedAt | timestamp | Yes | When payment was approved |
| createdAt | timestamp | No | Order submission time |

**Location:** `/src/db/schema.ts` (lines 153-176)

### `grcs` (Issued Certificates)
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| merchantId | uuid | No | FK to merchants |
| memberId | uuid | Yes | FK to users (null until claimed) |
| denomination | integer | No | Certificate value |
| status | enum | No | "pending", "active", "completed", "expired" |
| monthsRemaining | integer | No | Duration remaining |
| issuedAt | timestamp | No | When issued to customer |
| registeredAt | timestamp | Yes | When customer claimed |

**Location:** `/src/db/schema.ts` (lines 115-136)

### Relationships
```
merchants 1───* grcPurchases  (merchant purchases inventory)
merchants 1───* grcs          (merchant issues certificates)
users 1───* grcs              (member owns certificates)
```

### Inventory Calculation
```typescript
// Available inventory per merchant per denomination
const available =
  SUM(grcPurchases.quantity WHERE paymentStatus = 'confirmed' AND merchantId = X AND denomination = Y)
  - COUNT(grcs WHERE merchantId = X AND denomination = Y)
```

---

## API Specifications

### Get Pricing Tiers
**Endpoint:** `GET /api/merchant/grcs/purchase`
**Auth:** Merchant required
**Description:** Returns available denominations with pricing

**Response (200):**
```json
{
  "tiers": [
    { "denomination": 50, "pricePerCert": 1.25 },
    { "denomination": 75, "pricePerCert": 1.50 },
    { "denomination": 100, "pricePerCert": 1.75 },
    { "denomination": 500, "pricePerCert": 5.75 }
  ],
  "savedPaymentInfo": {
    "zelleAccountName": "Business Name",
    "bankAccountLast4": "1234"
  }
}
```

### Create Purchase Order
**Endpoint:** `POST /api/merchant/grcs/purchase`
**Auth:** Merchant required
**Description:** Creates a new GRC inventory purchase order

**Request:**
```json
{
  "items": [
    { "denomination": 50, "quantity": 10 },
    { "denomination": 100, "quantity": 5 }
  ],
  "paymentMethod": "zelle",
  "zelleAccountName": "Business Name"
}
```

**Response (201):**
```json
{
  "success": true,
  "purchaseId": "uuid",
  "totalCost": 21.25,
  "paymentInstructions": "Send payment to..."
}
```

### Get Inventory
**Endpoint:** `GET /api/merchant/grcs/inventory`
**Auth:** Merchant required
**Description:** Returns available inventory by denomination

**Response (200):**
```json
{
  "inventory": [
    { "denomination": 50, "available": 8 },
    { "denomination": 100, "available": 5 }
  ]
}
```

### Issue GRC
**Endpoint:** `POST /api/merchant/grcs/issue`
**Auth:** Merchant required
**Description:** Issues a single GRC to a customer

**Request:**
```json
{
  "email": "customer@example.com",
  "denomination": 50
}
```

**Response (201):**
```json
{
  "success": true,
  "grcId": "uuid",
  "claimUrl": "https://app.com/claim/uuid"
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| 400 | Invalid denomination or email |
| 400 | Insufficient inventory |
| 401 | Unauthorized |

### List Purchase Orders (Admin)
**Endpoint:** `GET /api/admin/orders`
**Auth:** Admin required
**Description:** Lists GRC purchase orders with pagination

**Query Params:** `page`, `limit`, `status`, `search`

**Response (200):**
```json
{
  "orders": [...],
  "pagination": { "total": 50, "page": 1, "limit": 20, "totalPages": 3 },
  "stats": { "pendingCount": 5, "pendingAmount": 150.00 }
}
```

### Approve Order (Admin)
**Endpoint:** `POST /api/admin/orders/{id}/approve`
**Auth:** Admin required
**Description:** Approves a pending purchase order

**Response (200):**
```json
{
  "success": true,
  "message": "Order approved"
}
```

---

## UI/UX Specifications

### Merchant Purchase Page
**Route:** `/merchant/purchase`
**Access:** Authenticated merchants

**Key Elements:**
- Denomination/quantity selector (add to cart pattern)
- Cart summary with running total
- Payment method selector (Zelle/Business Check)
- Payment details form (conditional on method)
- Confirmation screen with payment instructions

**User Flow:**
1. Merchant selects denomination and quantity, adds to cart
2. Merchant chooses payment method
3. Merchant enters payment details
4. Merchant submits order
5. System shows confirmation with payment instructions

### Admin Orders Page
**Route:** `/admin/orders`
**Access:** Admin users

**Key Elements:**
- Stats cards: Pending count/amount, Confirmed count/amount
- Filter tabs: Pending, Confirmed, Failed, All
- Search by merchant name
- Order list with approve/reject actions
- Modal for viewing check images

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Merchant issues more than available inventory | API returns 400 with "Insufficient inventory" |
| Admin approves already-approved order | Idempotent - no error, status remains "confirmed" |
| Customer claims already-claimed GRC | Redirect to dashboard showing existing GRC |
| GRC expires while member is active | Status updates to "expired", member notified |
| Merchant submits order but never pays | Order remains "pending", can be rejected by admin |

---

## Acceptance Criteria

- [x] Merchants can purchase inventory with both payment methods
- [x] Admins can approve/reject orders
- [x] Inventory calculation is accurate and real-time
- [x] GRCs can be issued when inventory is available
- [x] Customers receive claim emails
- [x] GRC records only created at issuance, not approval

---

## Technical Notes

### Duration Calculation
Based on denomination value:
```typescript
function getMonths(denomination: number): number {
  if (denomination <= 75) return 2;
  if (denomination <= 125) return 3;
  if (denomination <= 175) return 4;
  if (denomination <= 250) return 5;
  if (denomination <= 350) return 6;
  if (denomination <= 450) return 8;
  return 10;
}
```

**Location:** `/src/app/api/merchant/grcs/issue/route.ts` (lines 33-41)

### Pricing Tiers
```typescript
const tiers = [
  { denomination: 50, pricePerCert: 1.25 },
  { denomination: 75, pricePerCert: 1.50 },
  { denomination: 100, pricePerCert: 1.75 },
  // ... up to $500 at $5.75/cert
];
```

**Location:** `/src/app/api/merchant/grcs/purchase/route.ts`

### Why Two Tables?
Separating `grcPurchases` (inventory) from `grcs` (issued certificates):
1. Prevents inventory miscounts from pre-creating records
2. Allows flexible inventory queries without join complexity
3. Keeps issued GRC data clean (only actual certificates)
4. Supports inventory reconciliation audits

### Key Files
| File | Purpose |
|------|---------|
| `/src/db/schema.ts` | Database schema definitions |
| `/src/app/api/merchant/grcs/purchase/route.ts` | Purchase order creation |
| `/src/app/api/merchant/grcs/inventory/route.ts` | Inventory calculation |
| `/src/app/api/merchant/grcs/issue/route.ts` | Single GRC issuance |
| `/src/app/api/admin/orders/route.ts` | Order listing for admin |
| `/src/app/api/admin/orders/[id]/approve/route.ts` | Payment approval |
| `/src/app/merchant/purchase/page.tsx` | Merchant purchase UI |
| `/src/app/admin/orders/page.tsx` | Admin orders UI |

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-17 | Claude | Initial documentation from existing implementation |
