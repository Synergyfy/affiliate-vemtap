# Exhaustive Backend API Specification & Documentation — Pushed Changes (2026-08-01)

This document provides a comprehensive technical reference for all backend changes, database schema enhancements, and API endpoints developed and pushed today across the **Affiliate & Line Manager Network**, **Market Mapping**, **Operations Command**, **Platform Settings**, **Commissions**, **Withdrawals**, **Fraud Monitor**, **Training Academy**, and **Notifications** modules.

---

## 📋 Table of Contents

1. [Database Schema & Migration Overview](#1-database-schema--migration-overview)
2. [Platform Settings Module (`/settings`)](#2-platform-settings-module-settings)
3. [Market Mapping Module (`/market-mapping`)](#3-market-mapping-module-market-mapping)
4. [Line Manager & Network Module (`/network`)](#4-line-manager--network-module-network)
5. [Operations Command Module (`/operations`)](#5-operations-command-module-operations)
6. [Users & Affiliates Module (`/users`)](#6-users--affiliates-module-users)
7. [Commissions & Withdrawals Module (`/commissions` & `/withdrawals`)](#7-commissions--withdrawals-module-commissions--withdrawals)
8. [Fraud Monitor Module (`/fraud`)](#8-fraud-monitor-module-fraud)
9. [Training Academy Module (`/training`)](#9-training-academy-module-training)
10. [Notifications Module (`/notifications`)](#10-notifications-module-notifications)
11. [Global Error Codes & Security Standard](#11-global-error-codes--security-standard)

---

## 1. Database Schema & Migration Overview

Today's releases introduced 3 primary database migrations to `apps/api/prisma/schema.prisma`:

### Applied Migrations
1. `20260801160704_add_affiliate_dashboard_backend_features`
2. `20260801161916_add_admin_dashboard_backend_models`
3. `20260801163333_add_recurring_subscription_commission_settings`

### Key Data Models Introduced / Extended
* **`PlatformSettings`**: Expanded with 5 recurring subscription commission fields (`recurringAgentCommission`, `recurringAffiliateCommission`, `recurringLineManagerCommission`, `recurringDurationMonths`, `recurringYear2Rate`).
* **`TargetAdjustmentHistory`**: Audits manager and admin target modifications per user.
* **`MarketMappingPlan`**, **`MarketMappingNote`**, **`MarketMappingTerritoryConfig`**: Store affiliate mission plans, cluster notes, and territory defaults.
* **`MarketMappingHierarchy`**: Supports a 5-tier self-referential geographic tree (`COUNTRY`, `STATE`, `CITY`, `AREA`, `CLUSTER`).
* **`MarketMappingAssignment`**: Manages cluster assignments and targets for affiliates.
* **`MarketMappingAdminConfig`**: Persists customizable admin pipeline statuses and business categories.
* **`NotificationDraft`**: Stores unsent draft broadcasts with author metadata.
* **`TrainingProgress`**: Extended with `practiceResults` JSON storage for detailed simulation feedback.
* **`User`**: Enhanced with onboarding flags (`isTourCompleted`, `driversLicense`, `dailyLeadTarget`, `monthlyConversionTarget`).

---

## 2. Platform Settings Module (`/settings`)

Base Route: `/settings`  
Guards: `JwtAuthGuard`, `RolesGuard`

---

### `GET /settings`
* **Description**: Retrieves system-wide platform settings, including commission rates, threshold limits, promotion criteria, and recurring subscription commission parameters.
* **Roles Allowed**: `ADMIN`, `SUPER_ADMIN`
* **Query Parameters**: None
* **Sample Payload**: N/A

#### Sample Response Data (`200 OK`)
```json
{
  "id": "settings-uuid-001",
  "directCommissionRate": 0.15,
  "indirectCommissionRate": 0.1,
  "minWithdrawal": 10000,
  "withdrawalFee": 100,
  "subAffiliateUnlockCount": 5,
  "fraudThresholdScore": 75,
  "earningDurationMonths": 12,
  "agreementTemplate": "<h1>Affiliate Terms</h1>...",
  "agreementVersion": 2,
  "linkExpiryDays": 30,
  "managerRewardDurationMonths": 6,
  "maxIpUsage": 3,
  "reqAgentActiveDays": 90,
  "reqAgentActiveBusinesses": 40,
  "reqAgentMinReportingScore": 85,
  "reqAgentMinAttendanceRate": 90,
  "reqAffiliateActiveAgents": 30,
  "reqAffiliateNetworkBusinesses": 100,
  "reqSupervisorActiveAgents": 10,
  "reqSupervisorActiveSupervisors": 5,
  "reqSupervisorNetworkBusinesses": 100,
  "recurringAgentCommission": 5.0,
  "recurringAffiliateCommission": 10.0,
  "recurringLineManagerCommission": 3.0,
  "recurringDurationMonths": 12,
  "recurringYear2Rate": 50.0,
  "createdAt": "2026-05-01T10:00:00.000Z",
  "updatedAt": "2026-08-01T17:38:05.000Z"
}
```

#### Potential Errors
* `401 Unauthorized`: Missing or expired JWT bearer token.
* `403 Forbidden`: User does not possess `ADMIN` or `SUPER_ADMIN` role.

---

### `PATCH /settings`
* **Description**: Updates platform configuration settings and invalidates the backend cache.
* **Roles Allowed**: `ADMIN`, `SUPER_ADMIN`
* **Sample Request Payload**:
```json
{
  "recurringAgentCommission": 6.5,
  "recurringAffiliateCommission": 12.0,
  "recurringLineManagerCommission": 4.0,
  "recurringDurationMonths": 24,
  "recurringYear2Rate": 40.0,
  "minWithdrawal": 15000,
  "fraudThresholdScore": 80
}
```

#### Sample Response Data (`200 OK`)
Returns the complete updated `PlatformSettings` object.

#### Potential Errors
* `400 Bad Request`: Validation failure (e.g. `recurringAgentCommission` out of `0-100` range, or negative numbers).
* `401 Unauthorized` / `403 Forbidden`

---

### `GET /settings/agreement`
* **Description**: Returns the active affiliate agreement HTML template and current version.
* **Roles Allowed**: Public (`@Public()`)
* **Sample Response Data (`200 OK`)**:
```json
{
  "agreementTemplate": "<h1>Affiliate Agreement</h1><p>Terms and conditions...</p>",
  "agreementVersion": 2
}
```

---

### `PATCH /settings/agreement`
* **Description**: Updates the affiliate agreement template text and increments the version number.
* **Roles Allowed**: `ADMIN`, `SUPER_ADMIN`
* **Sample Request Payload**:
```json
{
  "agreementTemplate": "<h1>Affiliate Agreement v3.0</h1><p>Updated terms...</p>",
  "agreementVersion": 3
}
```

---

## 3. Market Mapping Module (`/market-mapping`)

Base Route: `/market-mapping`  
Guards: `JwtAuthGuard`, `RolesGuard`

---

### `GET /market-mapping/config`
* **Description**: Fetches cluster assignment and target defaults for the logged-in user.
* **Roles Allowed**: All Authenticated Roles (`AFFILIATE`, `AGENT`, `SUPERVISOR`, `MANAGER`, `ADMIN`, `SUPER_ADMIN`)
* **Sample Response Data (`200 OK`)**:
```json
{
  "id": "config-uuid",
  "userId": "user-uuid",
  "targetCluster": "Ikeja Central",
  "dailyVisitsTarget": 15,
  "weeklyConversionGoal": 5
}
```

---

### `GET /market-mapping/territory`
* **Description**: Calculates cluster territory statistics, mapped businesses count, active leads, and market penetration percentage.
* **Sample Response Data (`200 OK`)**:
```json
{
  "mappedBusinessesCount": 42,
  "activeLeadsCount": 18,
  "penetrationPercentage": 64.5
}
```

---

### `GET /market-mapping/plans`
* **Description**: Retrieves active mission plans and target history for the user.

---

### `POST /market-mapping/plans`
* **Description**: Creates a new field mission plan for a specific cluster.
* **Sample Request Payload**:
```json
{
  "title": "August Ikeja Commercial Sweep",
  "clusterId": "cluster-uuid-101",
  "targetCount": 50,
  "startDate": "2026-08-01T00:00:00.000Z",
  "endDate": "2026-08-31T23:59:59.000Z"
}
```

---

### `PATCH /market-mapping/plans/:id`
* **Description**: Updates an existing mission plan's status or target counts.
* **Sample Request Payload**:
```json
{
  "targetCount": 75,
  "status": "IN_PROGRESS"
}
```

---

### `GET /market-mapping/anchors`, `/priority-visits`, `/partnerships`, `/insights`
* **Description**: Returns intelligence feeds including anchor merchant accounts, AI priority visit recommendations, potential B2B partnership candidates, and cluster maturity scores.

---

### `GET /market-mapping/notes`
* **Query Parameters**: `?businessId=uuid-optional`
* **Sample Response Data (`200 OK`)**:
```json
[
  {
    "id": "note-uuid-1",
    "businessId": "biz-uuid-101",
    "content": "Owner requested follow-up meeting on Monday at 10 AM.",
    "followUpDate": "2026-08-03T10:00:00.000Z",
    "createdAt": "2026-08-01T14:20:00.000Z"
  }
]
```

---

### `POST /market-mapping/notes`
* **Sample Request Payload**:
```json
{
  "businessId": "biz-uuid-101",
  "content": "Owner requested follow-up meeting on Monday at 10 AM.",
  "followUpDate": "2026-08-03T10:00:00.000Z"
}
```

---

### `GET /market-mapping/reports` & `/reports/download`
* **Query Parameters**: `?period=monthly` (`daily`, `weekly`, `monthly`, `quarterly`)
* **Download Endpoint Headers**:
  * `Content-Type: text/csv`
  * `Content-Disposition: attachment; filename=market_mapping_report.csv`
* **CSV Escaping**: RFC 4180 compliant with double-quote escaping to prevent CSV injection vulnerabilities.

---

### Market Mapping Admin Endpoints (`ADMIN`, `SUPER_ADMIN`)

* `GET /market-mapping/admin/hierarchy`: Returns complete geographic hierarchy tree nodes.
* `POST /market-mapping/admin/hierarchy`: Creates a new region/state/city/cluster node.
  * **Payload**: `{ "name": "Ikeja Sector A", "type": "CLUSTER", "parentId": "parent-state-id", "totalBusinesses": 150, "penetrationRate": 25.0 }`
* `PATCH /market-mapping/admin/hierarchy/:id`: Updates node details.
* `DELETE /market-mapping/admin/hierarchy/:id`: Deletes a hierarchy node.
* `GET /market-mapping/admin/locations`: Lists all defined clusters/locations.
* `GET /market-mapping/admin/cluster/:id`: Detailed view of a cluster.
* `GET /market-mapping/admin/assignments`: Lists affiliate cluster target assignments.
* `POST /market-mapping/admin/assignments`: Assigns affiliate to cluster.
  * **Payload**: `{ "userId": "user-uuid", "clusterId": "cluster-uuid", "dailyTarget": 20, "weeklyTarget": 100, "monthlyTarget": 400, "allowUserEdit": true }`
* `PATCH /market-mapping/admin/assignments/:id`: Updates assignment targets.
* `DELETE /market-mapping/admin/assignments/:id`: Removes assignment.
* `GET /market-mapping/admin/cluster/:id/submissions`: Live cluster capture feed.
* `GET /market-mapping/admin/stats`: Overall market mapping statistics.
* `GET/PATCH /market-mapping/admin/editor-config`: Manages admin pipeline statuses and business categories.
  * **Payload**: `{ "pipelineStatuses": ["IDENTIFIED", "CONTACTED", "DEMO_SCHEDULED", "ONBOARDED"], "businessCategories": ["RETAIL", "PHARMACY", "HOSPITALITY", "SERVICES"] }`

---

## 4. Line Manager & Network Module (`/network`)

Base Route: `/network`  
Guards: `JwtAuthGuard`, `RolesGuard`

---

### `GET /network/recruits`
* **Description**: Lists direct downline recruits with activity indicators and commission totals.
* **Roles Allowed**: `AFFILIATE`, `SUPERVISOR`, `MANAGER`, `ADMIN`, `SUPER_ADMIN`
* **Query Parameters**: `?page=1&limit=10`
* **Sample Response Data (`200 OK`)**:
```json
{
  "data": [
    {
      "id": "agent-uuid-01",
      "fullName": "Alexander Pierce",
      "email": "alex.p@example.com",
      "role": "AGENT",
      "status": "ACTIVE",
      "createdAt": "2026-06-15T08:30:00.000Z",
      "totalCommissions": 150000,
      "activeBusinessesCount": 12
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### `GET /network/stats`
* **Description**: Provides network summary stats, total downline earnings, manager mode status, and unlocked milestone rewards.
* **Sample Response Data (`200 OK`)**:
```json
{
  "totalRecruits": 14,
  "activeRecruits": 10,
  "totalNetworkEarnings": 450000,
  "managerModeActive": true,
  "milestones": [
    {
      "type": "SILVER_PROMOTER",
      "title": "Silver Promoter",
      "unlocked": true,
      "claimed": true,
      "reward": 50000
    }
  ]
}
```

---

### `GET /network/team-member/:id`
* **Description**: Retrieves full profile, sales breakdown, and target adjustment history for a specific downline team member.
* **Security Guard**: Validates that the requested team member belongs to the requester's reporting hierarchy (IDOR protection).
* **Potential Errors**: `403 Forbidden` ("Access denied to team member detail"), `404 Not Found`.

---

### `POST /network/update-targets`
* **Description**: Updates target goals for a downline team member. Executes an atomic Prisma `$transaction` that updates `User` targets and logs a record into `TargetAdjustmentHistory`.
* **Roles Allowed**: `AFFILIATE`, `SUPERVISOR`, `MANAGER`, `ADMIN`, `SUPER_ADMIN`
* **Sample Request Payload**:
```json
{
  "memberId": "downline-user-uuid",
  "dailyLeadTarget": 15,
  "monthlyConversionTarget": 30,
  "reason": "Q3 Performance Goal Alignment"
}
```

#### Sample Response Data (`201 Created`)
```json
{
  "id": "downline-user-uuid",
  "dailyLeadTarget": 15,
  "monthlyConversionTarget": 30,
  "updatedAt": "2026-08-01T17:15:00.000Z"
}
```

---

### `GET /network/earnings-history` & `/team-reports`
* **Description**: Historical earnings time-series aggregated by period for line managers.

---

### `POST /network/claim-bonus` & `/toggle-manager-mode`
* **Claim Bonus Payload**: `{ "type": "SILVER_PROMOTER" }`
* **Toggle Manager Mode**: Switches extended earnings mode on or off.

---

## 5. Operations Command Module (`/operations`)

Base Route: `/operations`  
Guards: `JwtAuthGuard`

---

### `GET /operations/reports/hierarchy`
* **Description**: Returns 5-tier location tree structure for filter dropdown cascades.

---

### `GET /operations/reports/aggregates`
* **Description**: Computes aggregate metrics directly from database tables (`Lead`, `Business`, `Commission`, `User`).
* **Query Parameters**: `?period=monthly&role=AFFILIATE&locationId=loc-1`
* **Sample Response Data (`200 OK`)**:
```json
{
  "totalLeads": 1420,
  "activeConversions": 380,
  "totalEarnings": 12500000,
  "conversionRate": 26.76
}
```

---

### `GET /operations/reports/detail`
* **Description**: Returns 6-period historical trend charts and recent activity logs.
* **Query Parameters**: `?locationId=loc-1&period=monthly`

---

## 6. Users & Affiliates Module (`/users`)

Base Route: `/users`  
Guards: `JwtAuthGuard`, `RolesGuard`

---

### `PATCH /users/profile`
* **Description**: Updates profile details, bank payout info, and onboarding status.
* **Sample Request Payload**:
```json
{
  "fullName": "Jane Marketer",
  "phone": "08099887766",
  "bankName": "GTBank",
  "accountNumber": "0123456789",
  "isTourCompleted": true,
  "driversLicense": "DL-987654321"
}
```

---

### User Management Endpoints (`ADMIN`, `SUPER_ADMIN`)

* `GET /users/:id/locations`: Returns affiliate assigned territory.
* `PATCH /users/:id/locations`: Updates affiliate assigned territory (`{ "territoryId": "loc-uuid" }`).
* `POST /users/:id/send-email`: Sends an email via Resend and dispatches an in-app system notification.
  * **Payload**: `{ "subject": "Quarterly Review", "message": "Please review your targets." }`
* `GET /users/:id/reports`: Generates affiliate performance report.
* `GET /users/:id/history`: Retrieves target modification and login history.
* `GET /users/:id/team`: Returns downline team members.
* `PATCH /users/:id/targets`: Admin target adjustment with audit logging (`TargetAdjustmentHistory`).
  * **Payload**: `{ "dailyLeadTarget": 20, "monthlyConversionTarget": 40, "reason": "Target re-allocation" }`
* `PATCH /users/:id/assign-manager`: Assigns a line manager/supervisor (`{ "managerId": "manager-uuid" }`).

---

## 7. Commissions & Withdrawals Module (`/commissions` & `/withdrawals`)

---

### Commissions Endpoints (`ADMIN`, `SUPER_ADMIN`)
* `GET /commissions/admin/stats`: Global stats breakdown (total earned, pending, paid, rejected).
* `GET /commissions/export`: CSV export of all platform commissions (`Content-Type: text/csv`).

---

### Withdrawals Endpoints (`ADMIN`, `SUPER_ADMIN`)
* `GET /withdrawals/stats`: Withdrawal stats breakdown.
  * **Sample Response (`200 OK`)**:
  ```json
  {
    "totalPayouts": 15000000,
    "pendingRequests": 1200000,
    "approvedAmount": 800000,
    "completedAmount": 13000000
  }
  ```

---

## 8. Fraud Monitor Module (`/fraud`)

Base Route: `/fraud`  
Guards: `JwtAuthGuard`, `RolesGuard` (Role: `ADMIN`, `SUPER_ADMIN`)

---

* `GET /fraud/stats`: Global fraud metrics (alert counts, high-risk flagged accounts).
* `GET /fraud/guard-status`: Fetches current fraud guard score threshold.
* `PATCH /fraud/guard-status`: Updates global fraud guard sensitivity.
  * **Payload**: `{ "thresholdScore": 85 }`

---

## 9. Training Academy Module (`/training`)

---

### `PATCH /training/modules/:id/progress`
* **Description**: Updates progress for a training module, supporting interactive scenario simulation data and automatically stamping `completedAt`.
* **Sample Request Payload**:
```json
{
  "status": "COMPLETED",
  "quizScore": 95,
  "practiceResults": {
    "attempts": 2,
    "scenarioScores": {
      "pitching": 95,
      "handling_objections": 90
    }
  }
}
```

---

### `GET /training/admin/modules/:id/preview`
* **Description**: Admin preview of module content, quiz items, and practice scenario structures.

---

## 10. Notifications Module (`/notifications`)

---

### User Notification Endpoints
* `GET /notifications/unread-count`: Returns unread notification count (`{ "unreadCount": 5 }`).
* `PATCH /notifications/read-all`: Marks all user notifications as read.

---

### Admin Notification Draft Endpoints (`ADMIN`, `SUPER_ADMIN`)
* `GET /notifications/drafts`: Lists saved draft notifications.
* `POST /notifications/drafts`: Saves a draft notification.
  * **Payload**:
  ```json
  {
    "title": "Scheduled System Upgrade",
    "message": "Maintenance will occur on Sunday at 2 AM.",
    "type": "SYSTEM",
    "targetRoles": ["AFFILIATE", "AGENT"]
  }
  ```
* `GET /notifications/:id`: Detailed view of a notification.
* `DELETE /notifications/:id`: Deletes a notification record.

---

## 11. Global Error Codes & Security Standard

All endpoints follow consistent NestJS HTTP exception responses:

| HTTP Code | Error Name | Common Cause |
|---|---|---|
| `400 Bad Request` | `ValidationError` | Missing required fields, invalid format, or out-of-range DTO values. |
| `401 Unauthorized` | `UnauthorizedException` | Missing or invalid JWT bearer token in `Authorization` header. |
| `403 Forbidden` | `ForbiddenException` | User lacks required role permissions or fails IDOR hierarchy checks. |
| `404 Not Found` | `NotFoundException` | Resource with specified ID does not exist in database. |
| `409 Conflict` | `ConflictException` | Unique constraint violation (e.g. duplicate email or phone number). |
| `500 Internal Server Error` | `InternalServerErrorException` | Unexpected backend or database exception. |

---
*Documentation generated automatically on 2026-08-01.*
