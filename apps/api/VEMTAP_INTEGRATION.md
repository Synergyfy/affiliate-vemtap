# Vemtap Backend Integration Guide

This document explains how the main Vemtap backend should integrate with the Affiliate Management System.

## Base URL
`http://localhost:4005/api/external` (Development)
`https://affiliate-api.vemtap.com/api/external` (Production)

## Authentication
All requests must include the API key in the custom header:
**Header Name**: `x-api-key`
**Value**: configured on the affiliate backend as `VEMTAP_AFFILIATE_KEY` (a DB-issued API key also works).
A missing/invalid key returns `401`.

---

## 1. Validate Referral Code
Use this when a user enters a referral code during signup on Vemtap.

**Endpoint**: `GET /referrals/:code/validate`
**Example**: `GET /referrals/AFF001/validate`

### Response (Success)
```json
{
  "valid": true,
  "affiliateId": "uuid-123",
  "fullName": "John Doe",
  "referralCode": "AFF001"
}
```

### Response (Invalid/Inactive)
```json
{
  "valid": false
}
```

---

## 2. Record a Payment Commission Event
Called by Vemtap for **each successful paid subscription / recurring charge**. Credits the affiliate `rate × amountPaid`.

**Endpoint**: `POST /referrals/record`

### Request Body
```json
{
  "referralCode": "VEM-VLBAJY",
  "businessId": "edcf9de7-2397-474b-8720-412a4cb95e78",
  "businessName": "Tech Solutions Ltd",
  "ownerName": "Alice Smith",
  "email": "alice@techsolutions.com",
  "phone": "+2348012345678",
  "planName": "Professional",
  "planId": "25a9b67b-63ed-4df8-b222-58d0a2e22715",
  "address": "123 Business Way, Lagos",
  "amountPaid": 15000,
  "isFirstPayment": true,
  "rate": 30,
  "externalReference": "SUB-edcf9de7-...-1786706909521"
}
```

**Field Reference**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `referralCode` | string | Yes | Affiliate referral code used at signup |
| `businessId` | string | Yes | Vemtap's business UUID (links recurring payments) |
| `businessName` | string | Yes | Referred business name |
| `ownerName` | string | Yes | Business owner name |
| `email` | string | Yes | Business contact email |
| `planName` | string | Yes | Opaque plan name (dynamic, admin-defined) |
| `amountPaid` | number | Yes | Actual amount charged for this payment (NGN) |
| `isFirstPayment` | boolean | Yes | `true` = first successful paid subscription for the business |
| `rate` | number | Yes | Commission % (30 first payment, 10 recurring) |
| `externalReference` | string | Yes | **Payment reference** — unique per payment, NOT per business |
| `phone` | string | No | Business contact phone |
| `planId` | string | No | Opaque plan id |
| `address` | string | No | Business address |

**Semantics**
- `externalReference` = payment reference → unique **per payment**, so recurring payments are separate commission events (each one credits).
- Commission credited = `rate × amountPaid` (e.g. 30% × ₦15,000 = ₦4,500).
- First payment creates the business record + counts as a referral; recurring payments reuse the business and credit again without creating a duplicate or returning 409.

**Idempotency**
- Send an optional `Idempotency-Key` header (or reuse `externalReference`) to make the call idempotent.
- Replaying the same key/reference returns the **original success response** (`200`, `deduplicated: true`) without double-crediting.

### Response (Success)
```json
{
  "businessId": "business-uuid-456",
  "commissionTriggered": true,
  "deduplicated": false
}
```
Replay: `200` with `{ "deduplicated": true, ...original }`.

---

## 3. Request Affiliate Withdrawal
Use this if Vemtap handles the "Withdraw" button for affiliates and needs to sync the request to the affiliate system.

**Endpoint**: `POST /withdrawals/process`

### Request Body
```json
{
  "email": "alice@affiliate.com",
  "amount": 5000,
  "bankName": "GTBank",
  "accountNumber": "0123456789",
  "accountName": "Alice Smith",
  "externalReference": "VEM-WD-998"
}
```

*The affiliate is identified by `email`; bank details are supplied in the payload (and backfilled to the profile). This creates a `PENDING` withdrawal that an admin must approve in the Affiliate Dashboard. Idempotency works the same as referrals — replay the same `Idempotency-Key`/`externalReference` to get the original success response.*

### Response (Success)
```json
{
  "withdrawalId": "withdrawal-uuid-123",
  "status": "PENDING",
  "deduplicated": false
}
```

---

## 4. Fetch Affiliate Users
Use this inside the Vemtap Admin dashboard so admins can search/filter and select an affiliate before manually attaching a business.

**Endpoint**: `GET /external/affiliates`

### Query Parameters
* `search` *(string, optional)*: Match by full name, email, phone, or referral code (case-insensitive).
* `status` *(string, optional)*: Filter by status (`ACTIVE`, `SUSPENDED`, `DEACTIVATED`).
* `page` *(number, optional, default: 1)*: Page number for pagination.
* `limit` *(number, optional, default: 50)*: Number of results to return per page.

### Response (Success)
```json
{
  "data": [
    {
      "id": "affiliate-uuid-123",
      "fullName": "John Doe",
      "email": "john@affiliate.com",
      "phone": "+2348012345678",
      "referralCode": "VEM-JD123",
      "status": "ACTIVE",
      "createdAt": "2026-05-19T22:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

---

## 5. Attach Business to Affiliate (Manual Attachment)
Use this inside the Vemtap Admin dashboard when an admin manually attaches a business to a selected affiliate. This creates a `Business` record in the Affiliate platform, increments the affiliate's referral count, and triggers appropriate direct/indirect commissions.

**Endpoint**: `POST /external/businesses/attach`

### Request Body
```json
{
  "affiliateId": "affiliate-uuid-123",
  "businessName": "Acme Ventures Ltd",
  "ownerName": "Alice Smith",
  "email": "alice@acmeventures.com",
  "phone": "+2348098765432",
  "amount": 10000,
  "planType": "PROFESSIONAL",
  "address": "456 Corporate Boulevard, Lagos",
  "businessType": "Technology"
}
```
*`amount` is the actual subscription amount charged by Vemtap and is required. The affiliate backend does not derive pricing from `planType`. Valid `planType` values: `BASIC`, `STARTER`, `PROFESSIONAL`, `ENTERPRISE`.*

### Response (Success)
```json
{
  "businessId": "business-uuid-456",
  "commissionTriggered": true
}
```

---

## Error Handling
* **401 Unauthorized**: API key is missing, invalid, or has been revoked.
* **400 Bad Request**: Missing required fields, invalid types, insufficient balance, or missing KYC. Returned **only for genuine validation errors**.
* **404 Not Found**: Referral code / affiliate email does not exist (terminal).
* **408/429/5xx**: Retryable — Vemtap retries with exponential backoff. `429` includes a `Retry-After` header.

## Status-Code Contract (drives retry)
| Class | Codes | Vemtap behavior |
|-------|-------|-----------------|
| Success | `200`/`201` | Record accepted / commission credited |
| Idempotent replay | `200` (`deduplicated: true`) | Same response, no double-credit |
| Terminal (no retry) | `400`/`401`/`403`/`404`/`409`/`422` | Surface to user; do not retry |
| Retryable | `408`/`429`/`5xx`, timeout/drop | Retry up to 5× with exponential backoff |
