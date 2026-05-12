# Affiliate Dashboard API Documentation

This document describes the endpoints available for the affiliate dashboard. These endpoints are designed to provide statistical, historical, and predictive data for affiliate users.

## Authentication

All endpoints require a valid JWT access token sent in an `httpOnly` cookie. The user must have the `AFFILIATE`, `ADMIN`, or `SUPER_ADMIN` role.

- **Global Prefix**: `/api`
- **Controller Prefix**: `/affiliate/dashboard`

---

## 1. Get Affiliate Stats
Returns a high-level overview of the affiliate's earnings and referral performance.

- **Endpoint**: `GET /affiliate/dashboard/stats`
- **Auth Required**: Yes (`AFFILIATE`+)
- **Response**: `AffiliateStatsResponseDto`

### Response Data
```json
{
  "totalEarnings": 150000.50,
  "pendingEarnings": 25000.00,
  "activeReferrals": 12,
  "referralCount": 45
}
```

| Field | Type | Description |
|---|---|---|
| `totalEarnings` | `number` | Cumulative earnings paid out or available for withdrawal. |
| `pendingEarnings` | `number` | Earnings from commissions that are not yet cleared. |
| `activeReferrals` | `number` | Count of referred businesses with an `ACTIVE` subscription status. |
| `referralCount` | `number` | Total number of users/businesses referred (all statuses). |

---

## 2. Get Earnings Forecast
Provides a projection of future earnings based on current active subscriptions.

- **Endpoint**: `GET /affiliate/dashboard/forecast`
- **Auth Required**: Yes (`AFFILIATE`+)
- **Response**: `AffiliateForecastResponseDto`

### Response Data
```json
{
  "monthlyRecurringRevenue": 340000.00,
  "activeBusinessCount": 15,
  "projectedEarnings": 340000.00
}
```

| Field | Type | Description |
|---|---|---|
| `monthlyRecurringRevenue` | `number` | The total monthly commission from all `ACTIVE` businesses. |
| `activeBusinessCount` | `number` | Number of businesses contributing to the forecast. |
| `projectedEarnings` | `number` | Projected earnings for the next 30 days. |

---

## 3. Get Dashboard Charts
Returns historical data for earnings and referrals over the last 30 days.

- **Endpoint**: `GET /affiliate/dashboard/charts`
- **Auth Required**: Yes (`AFFILIATE`+)
- **Response**: `AffiliateChartsResponseDto`

### Response Data
```json
{
  "earningsHistory": [
    { "date": "2026-04-05", "value": 5000.00 },
    { "date": "2026-04-06", "value": 0.00 },
    ...
  ],
  "referralTrends": [
    { "date": "2026-04-05", "value": 2 },
    { "date": "2026-04-06", "value": 0 },
    ...
  ]
}
```

| Array | Data Point | Description |
|---|---|---|
| `earningsHistory` | `{ date: string, value: number }` | Daily sum of commissions earned. |
| `referralTrends` | `{ date: string, value: number }` | Daily count of new business referrals. |

---

## 4. Get Leaderboard
Returns the global ranking of top affiliates by total earnings.

- **Endpoint**: `GET /affiliate/dashboard/leaderboard`
- **Auth Required**: Yes (`AFFILIATE`+)
- **Query Params**: 
    - `limit` (optional, default: 10): Number of records to return.
- **Response**: `LeaderboardResponseDto[]`

### Response Data
```json
[
  {
    "rank": 1,
    "fullName": "John Doe",
    "totalEarnings": 1250000.00,
    "referralCount": 150
  },
  ...
]
```

---

## 5. Get My Businesses (Filtered)
Returns a paginated and filtered list of businesses referred by the current user.

- **Endpoint**: `GET /businesses/me`
- **Auth Required**: Yes (`AFFILIATE`+)
- **Query Params**:
    - `search` (optional): Search by business name, owner name, email, or phone.
    - `status` (optional): Filter by `TRIAL`, `ACTIVE`, `EXPIRED`, `CANCELLED`.
    - `planType` (optional): Filter by `BASIC`, `STARTER`, `PROFESSIONAL`, `ENTERPRISE`.
    - `startDate` (optional): ISO date for registration start.
    - `endDate` (optional): ISO date for registration end.
    - `page`, `limit`: Standard pagination.

---

## 6. Update Business Details
Allows an affiliate to update the contact information for their referred business.

- **Endpoint**: `PATCH /businesses/:id`
- **Auth Required**: Yes (`AFFILIATE`+)
- **Payload**: `UpdateBusinessDto`

### Request Body
```json
{
  "businessName": "New Business Name",
  "ownerName": "New Owner Name",
  "email": "new@example.com",
  "phone": "08012345678",
  "address": "123 New Street",
  "businessType": "Retail"
}
```

---

## 7. Send Payment Reminder
Triggers a payment reminder for a business lead that has not yet paid.

- **Endpoint**: `POST /businesses/:id/reminder`
- **Auth Required**: Yes (`AFFILIATE`+)
- **Constraints**: 
    - Business status must NOT be `ACTIVE`.
    - Can only be sent once every 24 hours.

---

## 8. Export Businesses to CSV
Generates a CSV file of the affiliate's referred businesses based on current filters.

- **Endpoint**: `GET /businesses/export`
- **Auth Required**: Yes (`AFFILIATE`+)
- **Query Params**: Same as `GET /businesses/me`.
- **Response**: `text/csv` file stream.

---

## 9. Get Network Stats
Returns detailed statistics for the affiliate's network, including milestones and manager status.

- **Endpoint**: `GET /network/stats`
- **Auth Required**: Yes (`AFFILIATE`+)
- **Response**: `NetworkStatsResponseDto`

### Response Data
```json
{
  "activeAgentsCount": 15,
  "totalNetworkBusinesses": 45,
  "milestones": {
    "agents": { "current": 15, "target": 30, "isReached": false },
    "businesses": { "current": 45, "target": 100, "isReached": false }
  },
  "managerQualificationExpiry": "2026-08-05T00:00:00Z",
  "isManagerMode": false,
  "hasClaimedAgentBonus": false,
  "hasClaimedBusinessBonus": false
}
```

---

## 10. Claim Milestone Bonus
Claims a bonus once a milestone target is reached.

- **Endpoint**: `POST /network/claim-bonus`
- **Auth Required**: Yes (`AFFILIATE`+)
- **Payload**: `{ "type": "AGENT" | "BUSINESS" }`
- **Response**: `{ "success": true, "amount": 5000 }`

---

## 11. Toggle Manager Mode
Enables or disables "Extended Earnings" mode (Manager Mode) if qualified.

- **Endpoint**: `POST /network/toggle-manager-mode`
- **Auth Required**: Yes (`AFFILIATE`+)
- **Response**: `{ "isManagerMode": true, "expiry": "2026-08-05T00:00:00Z" }`
- **Constraints**: 
    - Must have reached both milestones (30 active agents AND 100 network businesses).

---

## Possible Errors (Network)

| Status Code | Error | Cause |
|---|---|---|
| `400` | `Bad Request` | Target not reached for bonus, bonus already claimed, or milestones not reached for Manager Mode. |

---

## Technical Note: Manager Mode
When **Manager Mode** is enabled:
- Indirect commission rate is boosted from **5%** to **10%**.
- A `[Manager Mode Boost]` tag is added to the commission description.
- Users have a 90-day qualification window (configurable).

---

---

## 12. Request Email Update
Initiates the email update process by sending an OTP to the new email address.

- **Endpoint**: `POST /users/request-email-update`
- **Auth Required**: Yes (`AFFILIATE`+)
- **Payload**: `{ "newEmail": "string" }`
- **Response**: `{ "message": "Verification code sent to your new email" }`

---

## 13. Verify Email Update
Confirms the OTP and updates the user's primary email address.

- **Endpoint**: `POST /users/verify-email-update`
- **Auth Required**: Yes (`AFFILIATE`+)
- **Payload**: `{ "code": "string" }`
- **Response**: `UserResponseDto` (Updated profile)

---

## 14. Upload File
Uploads a file (KYC documents, profile pictures) to the storage service.

- **Endpoint**: `POST /storage/upload`
- **Auth Required**: Yes (`AFFILIATE`+)
- **Payload**: `multipart/form-data` (field: `file`)
- **Response**: `{ "url": "string" }`
- **Constraints**: 
    - Max size: 5MB.
    - Allowed types: `jpg`, `jpeg`, `png`, `pdf`.

---

## Possible Errors (Profile & Storage)

| Status Code | Error | Cause |
|---|---|---|
| `409` | `Conflict` | New email is already in use by another account. |
| `400` | `Bad Request` | Invalid or expired OTP code, or invalid file type/size. |

---

## Technical Note: Leveling System
The system automatically calculates a user's **Tier** based on their referral count:
- **BRONZE**: 0 - 10 referrals.
- **SILVER**: 11 - 50 referrals.
- **GOLD**: 51+ referrals.

The tier is returned in the `UserResponseDto` as the `tier` field.

---

## Possible Errors

---

## Implementation Details

- **Monetary Precision**: All amount fields use `Decimal` logic on the backend and are returned as `number` for frontend convenience.
- **Data Range**: Chart data is hardcoded to the last 30 days.
- **Caching**: Dashboard stats are currently computed on the fly; caching may be added in `DashboardService` if performance requirements increase.
- **CSV Format**: Standard RFC 4180 CSV with headers.

---

## Technical Note: Test Environment Fixes

During the implementation and verification of these endpoints, several fixes were made to the core testing infrastructure:

### 1. Database Isolation
**Issue**: The `prisma db push` command was incorrectly loading the `.env` file instead of the `.env.test` file, causing it to push schema changes to the development database during E2E setup.
**Fix**: Updated `scripts/create-test-db.ts` to temporarily rename `.env` to `.env.backup` during the schema push phase. This forces Prisma to respect the `DATABASE_URL` provided in the test environment.

### 2. Prisma Schema Requirements
**Issue**: The Prisma schema requires a `DIRECT_URL` environment variable which was missing from the test configuration.
**Fix**: Added `DIRECT_URL` to `apps/api/.env.test` pointing to the test database.

### 3. Cleanup Logic
**Issue**: E2E tests were failing during teardown due to foreign key constraints (trying to delete Users while Businesses still referenced them).
**Fix**: Updated the cleanup order in `beforeAll` and `afterAll` blocks to ensure dependent records (Commissions, Businesses) are removed before parent records (Users).
