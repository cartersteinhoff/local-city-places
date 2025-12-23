# GRC (Gift Receipt Card) System - Product Requirements Document

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Status** | Complete |
| **Author** | Local City Places Team |
| **Created** | 2024-01-01 |
| **Last Updated** | 2024-12-17 |

---

## Problem Statement

Local merchants need a way to offer gift certificates to customers that:
1. Drive repeat business through ongoing customer visits
2. Generate immediate revenue from certificate sales
3. Reward customers for shopping local through a structured program

Traditional gift cards are one-time use and don't create ongoing engagement. GRCs solve this by providing multi-month certificates that keep customers returning to participating merchants.

---

## Target Users

| User Type | Needs | Current Pain Points |
|-----------|-------|---------------------|
| **Merchants** | Affordable way to offer gift certificates, simple issuance process | Traditional gift card systems are expensive and complex |
| **Members** | Receive and redeem certificates at local businesses | No unified system for local gift certificates |
| **Admins** | Track purchases, verify payments, monitor system health | Manual processes prone to errors |

---

## User Stories

### Merchants
- As a merchant, I want to purchase GRC inventory in bulk so that I can issue certificates to customers affordably
- As a merchant, I want to pay via Zelle or business check so that I can use my preferred payment method
- As a merchant, I want to issue a GRC to a customer via email so they can claim it easily
- As a merchant, I want to see my available inventory so I know when to purchase more

### Members (Customers)
- As a member, I want to receive a GRC via email so I can claim it from anywhere
- As a member, I want to see my active GRCs so I know what benefits I have available
- As a member, I want to track months remaining so I know how long I can use each certificate

### Admins
- As an admin, I want to approve merchant payments so inventory is only released after payment verification
- As an admin, I want to reject invalid payments so merchants know to retry
- As an admin, I want to see pending orders so I can process them quickly

---

## Success Metrics

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| GRC Purchase Volume | N/A | Growth trend | Sum of grcPurchases.quantity confirmed monthly |
| GRC Issuance Rate | N/A | >50% of inventory | Issued GRCs / Confirmed inventory |
| Time to Payment Approval | N/A | <24 hours | Avg time from submission to confirmation |
| Member Claim Rate | N/A | >80% | Claimed GRCs / Issued GRCs |

---

## Scope

### In Scope
- [x] Merchant GRC inventory purchase flow
- [x] Multiple payment methods (Zelle, Business Check)
- [x] Admin payment approval workflow
- [x] Single GRC issuance to customers
- [x] Bulk GRC issuance
- [x] Member GRC claiming and tracking
- [x] Inventory tracking per merchant per denomination
- [x] Duration-based validity (2-10 months based on value)

### Out of Scope
- Automatic payment verification (requires manual admin approval)
- GRC transfers between members
- Partial redemption tracking
- Mobile app (web-only for now)

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Email service | Technical | Complete | Used for GRC claim links |
| Payment processing | Business | Manual | Zelle/check verified manually by admin |
| Member registration | Technical | Complete | Members must register to claim |

---

## Risks & Concerns

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Payment fraud | High | Low | Manual admin verification of all payments |
| Inventory miscalculation | High | Medium | Strict separation of purchase records vs issued GRCs |
| Member confusion about expiry | Medium | Medium | Clear duration display and notifications |

---

## Open Questions

- [x] ~~How should duration be calculated?~~ → Based on denomination tiers
- [x] ~~What payment methods to support?~~ → Zelle and Business Check
- [ ] Should expired GRCs have a grace period?
- [ ] Should merchants be able to cancel unissued inventory?

---

## References

- [FRD: GRC System](./frd.md)
- [CLAUDE.md: GRC Data Model](../../../CLAUDE.md#grc-data-model)
