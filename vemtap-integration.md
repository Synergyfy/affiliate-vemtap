# VEMTAP Main Backend → Affiliate Backend Integration

## Overview

The VEMTAP affiliate backend exposes agent management endpoints that the VEMTAP main backend can consume to read and manage agent data for the compensation analytics dashboard.

**Base URL:** `https://affiliate-api.vemtap.com/api` (or `http://localhost:4005/api` for local dev)

---

## Authentication

Two authentication methods are supported. You only need one.

### Option A: Shared Secret (Preferred — for VEMTAP main backend)

Send the `x-vemtap-secret` header on every request. This is the same auth mechanism used by `POST /api/integration/vemtap/payment`.

```
x-vemtap-secret: <VEMTAP_SHARED_SECRET>
```

The shared secret is configured via the `VEMTAP_SHARED_SECRET` environment variable on the affiliate backend.

### Option B: JWT Bearer Token

```
Authorization: Bearer <jwt-token>
```

The JWT must belong to a user with `ADMIN`, `SUPER_ADMIN`, or `MANAGER` role.

---

## Endpoints

### GET /agents — List Agents

Returns paginated agents with computed metrics (network size, revenue generated, commissions).

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `perPage` | number | No | Results per page (default: 10, max: 100) |
| `search` | string | No | Search by name, email, or phone |
| `status` | string | No | Filter by status: `ACTIVE`, `SUSPENDED`, `DEACTIVATED` |

**Request:**
```
GET /api/agents?page=1&perPage=10
x-vemtap-secret: <shared_secret>
```

**Response (200):**
```json
{
  "agents": [
    {
      "id": "uuid-string",
      "name": "Chidi Okafor",
      "email": "chidi@vemtap.com",
      "phone": "+2348022334455",
      "status": "ACTIVE",
      "dateJoined": "2026-01-15T00:00:00.000Z",
      "managerId": "uuid-parent",
      "managerName": "Azeem Bello",
      "businessesCount": 6,
      "managedMrr": 1250000,
      "commissionEarned": 187500
    }
  ],
  "total": 42
}
```

**Field Reference:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique agent identifier (UUID) |
| `name` | string | Agent's full name |
| `email` | string | Agent's email address |
| `phone` | string or null | Agent's phone number |
| `status` | string | `ACTIVE`, `SUSPENDED`, or `DEACTIVATED` |
| `dateJoined` | string (ISO) | When the agent registered |
| `managerId` | string or null | Parent agent's ID. `null` means this agent is a **Manager** |
| `managerName` | string or null | Parent agent's name |
| `businessesCount` | number | Count of active subscribed businesses (**Network Size**) |
| `managedMrr` | number | Sum of MRR from active businesses (**Revenue Generated**) |
| `commissionEarned` | number | Sum of commission amounts from active businesses |

**Status → Role Derivation:**
- `managerId` is `null` → Agent is a **Manager** (no one above them)
- `managerId` is populated → Agent reports to someone

---

### GET /agents/:id — Agent Detail

Returns full agent profile including subordinates and businesses.

**Request:**
```
GET /api/agents/uuid-string
x-vemtap-secret: <shared_secret>
```

**Response (200):**
```json
{
  "id": "uuid-string",
  "name": "Chidi Okafor",
  "email": "chidi@vemtap.com",
  "phone": "+2348022334455",
  "status": "ACTIVE",
  "dateJoined": "2026-01-15T00:00:00.000Z",
  "managerId": "uuid-parent",
  "managerName": "Azeem Bello",
  "businessesCount": 6,
  "managedMrr": 1250000,
  "commissionEarned": 187500,
  "subordinates": [
    {
      "id": "uuid-sub",
      "name": "Sub Agent One",
      "email": "sub1@vemtap.com"
    }
  ],
  "businesses": [
    {
      "id": "biz-uuid",
      "name": "Business Name",
      "plan": "PROFESSIONAL",
      "mrr": 250000,
      "status": "ACTIVE"
    }
  ]
}
```

**Extra Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `subordinates` | array | Agents who report to this agent (`managerId` = this agent's `id`) |
| `subordinates[].id` | string | Subordinate's ID |
| `subordinates[].name` | string | Subordinate's full name |
| `subordinates[].email` | string | Subordinate's email |
| `businesses` | array | Active businesses referred by this agent |
| `businesses[].id` | string | Business ID |
| `businesses[].name` | string | Business name |
| `businesses[].plan` | string | Plan type (`BASIC`, `STARTER`, `PROFESSIONAL`, `ENTERPRISE`) |
| `businesses[].mrr` | number | Monthly recurring revenue |
| `businesses[].status` | string | Business status |

**Response (404):**
```json
{
  "statusCode": 404,
  "message": "Agent not found"
}
```

---

### GET /agents/:id/revenue — Monthly Revenue Trend

Returns 12 months of historical revenue data for the bar chart.

**Request:**
```
GET /api/agents/uuid-string/revenue
x-vemtap-secret: <shared_secret>
```

**Response (200):**
```json
{
  "months": [
    { "month": "Jul", "revenue": 0 },
    { "month": "Aug", "revenue": 850000 },
    { "month": "Sep", "revenue": 920000 },
    { "month": "Oct", "revenue": 1100000 },
    { "month": "Nov", "revenue": 1250000 },
    { "month": "Dec", "revenue": 1250000 },
    { "month": "Jan", "revenue": 1300000 },
    { "month": "Feb", "revenue": 1400000 },
    { "month": "Mar", "revenue": 1350000 },
    { "month": "Apr", "revenue": 1500000 },
    { "month": "May", "revenue": 1600000 },
    { "month": "Jun", "revenue": 1700000 }
  ]
}
```

Revenue is cumulative MRR from active businesses attributed to the agent, grouped by month. Months with no business activity return `0`.

---

### POST /agents — Create Agent

Creates a new agent user in the system.

**Request:**
```
POST /api/agents
x-vemtap-secret: <shared_secret>
Content-Type: application/json

{
  "name": "Chidi Okafor",
  "email": "chidi@vemtap.com",
  "phone": "+2348022334455",
  "password": "optional-password",
  "status": "ACTIVE",
  "managerId": "uuid-parent"
}
```

**Body Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | Yes | — | Agent's full name |
| `email` | string | Yes | — | Agent's email (must be unique) |
| `phone` | string | Yes | — | Agent's phone (must be unique) |
| `password` | string | No | Auto-generated | If omitted, a random 12-char password is generated |
| `status` | string | No | `ACTIVE` | `ACTIVE`, `SUSPENDED`, or `DEACTIVATED` |
| `managerId` | string | No | `null` | ID of the parent agent. `null` → this agent is a Manager |

**Response (201):** Returns the full agent detail (same shape as `GET /agents/:id`).

**Response (409):**
```json
{
  "statusCode": 409,
  "message": "Agent with this email or phone already exists"
}
```

---

### PATCH /agents/:id — Update Agent

Updates one or more fields on an existing agent.

**Request:**
```
PATCH /api/agents/uuid-string
x-vemtap-secret: <shared_secret>
Content-Type: application/json

{
  "name": "Chidi Updated",
  "status": "SUSPENDED",
  "managerId": "new-manager-uuid"
}
```

All fields are optional. Only provided fields are updated.

**Response (200):** Returns the full updated agent detail.

---

### DELETE /agents/:id — Remove Agent

Soft-deletes an agent by setting their status to `DEACTIVATED`.

**Request:**
```
DELETE /api/agents/uuid-string
x-vemtap-secret: <shared_secret>
```

**Response (204):** No content. Successful deactivation.

---

## Error Handling

| Status Code | Meaning | Handling |
|-------------|---------|----------|
| `200` | Success | Process response body |
| `201` | Created | Agent created successfully |
| `204` | No Content | Agent deleted successfully |
| `401` | Unauthorized | Missing or invalid `x-vemtap-secret` header or JWT token |
| `404` | Not Found | Agent with given ID does not exist |
| `409` | Conflict | Email or phone already in use (POST/PATCH) |
| `5xx` | Server Error | Internal affiliate backend error |

---

## Data Model Mapping

| Affiliate Backend (Prisma) | API Response Field | Notes |
|---|---|---|
| `User.id` | `id` | UUID |
| `User.fullName` | `name` | — |
| `User.email` | `email` | — |
| `User.phone` | `phone` | Nullable |
| `User.status` | `status` | `ACTIVE`, `SUSPENDED`, or `DEACTIVATED` |
| `User.createdAt` | `dateJoined` | ISO timestamp |
| `User.referrerId` | `managerId` | `null` = Manager role |
| Referrer's `fullName` | `managerName` | Join via `User.referrer` relation |
| Count of `Business` where `affiliateId = user.id AND status = ACTIVE` | `businessesCount` | — |
| Sum of `Business.subscriptionAmount` where condition above | `managedMrr` | — |
| Sum of `Business.commissionAmount` where condition above | `commissionEarned` | Each business stores its computed commission |
| Users where `referrerId = agent.id` | `subordinates` | Only in detail endpoint |
| Businesses where `affiliateId = agent.id AND status = ACTIVE` | `businesses` | Only in detail endpoint |

---

## Example Integration (Node.js)

```typescript
const SECRET = process.env.AFFILIATE_SHARED_SECRET;
const BASE = 'https://affiliate-api.vemtap.com/api';

const headers = {
  'x-vemtap-secret': SECRET,
  'Content-Type': 'application/json',
};

// List agents
const { agents, total } = await fetch(`${BASE}/agents?page=1&perPage=10`, {
  headers,
}).then(r => r.json());

// Get agent detail
const agent = await fetch(`${BASE}/agents/${agentId}`, {
  headers,
}).then(r => r.json());

// Get revenue trend
const { months } = await fetch(`${BASE}/agents/${agentId}/revenue`, {
  headers,
}).then(r => r.json());

// Create agent
const newAgent = await fetch(`${BASE}/agents`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    name: 'Chidi Okafor',
    email: 'chidi@vemtap.com',
    phone: '+2348022334455',
  }),
}).then(r => r.json());

// Update agent
const updated = await fetch(`${BASE}/agents/${agentId}`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ status: 'SUSPENDED' }),
}).then(r => r.json());

// Delete agent
await fetch(`${BASE}/agents/${agentId}`, {
  method: 'DELETE',
  headers,
});
```
