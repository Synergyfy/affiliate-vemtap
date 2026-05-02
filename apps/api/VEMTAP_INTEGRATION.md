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
  "planType": "PROFESSIONAL",
  "address": "123 Business Way, Lagos"
}
```
*Valid `planType` values: `BASIC`, `STARTER`, `PROFESSIONAL`, `ENTERPRISE`*

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

## Error Handling
* **401 Unauthorized**: API key is missing, invalid, or has been revoked.
* **400 Bad Request**: Missing required fields or insufficient affiliate balance.
* **409 Conflict**: A business with that email is already registered.
