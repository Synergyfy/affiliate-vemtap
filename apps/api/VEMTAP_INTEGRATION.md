# Vemtap Backend Integration Guide

This document explains how the main Vemtap backend should integrate with the Affiliate Management System.

## Base URL
`http://localhost:4005/api/external` (Development)
`https://affiliate-api.vemtap.com/api/external` (Production)

## Authentication
All requests must include the API key in the custom header:
**Header Name**: `x-api-key`
**Value**: `vem_3774d66ba1ac7392c877d121bb3c919b65df2c9d11b66555f2e4efe6`

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

## 2. Record Successful Referral
Use this when a referred business successfully pays for a plan on Vemtap. This triggers commission generation.

**Endpoint**: `POST /referrals/record`

### Request Body
```json
{
  "referralCode": "AFF001",
  "businessName": "Tech Solutions Ltd",
  "ownerName": "Alice Smith",
  "email": "alice@techsolutions.com",
  "phone": "+2348012345678",
  "amount": 10000,
  "planType": "PROFESSIONAL",
  "address": "123 Business Way, Lagos"
}
```
*`amount` is the actual subscription amount charged by Vemtap and is required. The affiliate backend does not derive pricing from `planType`. Valid `planType` values: `BASIC`, `STARTER`, `PROFESSIONAL`, `ENTERPRISE`.*

---

## 3. Request Affiliate Withdrawal
Use this if Vemtap handles the "Withdraw" button for affiliates and needs to sync the request to the affiliate system.

**Endpoint**: `POST /withdrawals/process`

### Request Body
```json
{
  "affiliateId": "uuid-123",
  "amount": 5000,
  "externalReference": "VEM-WD-998"
}
```
*Note: This creates a `PENDING` withdrawal that an admin must approve in the Affiliate Dashboard.*

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
* **400 Bad Request**: Missing required fields, invalid format, or attempt to attach to an inactive affiliate.
* **404 Not Found**: Affiliate with the specified `affiliateId` does not exist.
* **409 Conflict**: A business with the specified email address is already registered in the affiliate system.
