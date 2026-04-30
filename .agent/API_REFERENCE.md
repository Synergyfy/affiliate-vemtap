# API Reference — Vemtap Endpoints

All routes are prefixed with `/api`. Swagger UI is at `http://localhost:3001/docs`.

---

## Authentication (`/api/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | None | Register a new affiliate |
| POST | `/auth/login` | None | Login and receive tokens as cookies |
| POST | `/auth/refresh` | refresh_token cookie | Rotate tokens |
| POST | `/auth/logout` | None | Clear auth cookies |
| POST | `/auth/invalidate-all` | ✅ JWT | Revoke all sessions (increment tokenVersion) |
| GET | `/auth/me` | ✅ JWT | Get authenticated user profile |

### Cookie Behaviour

All auth responses set or clear these `httpOnly` cookies:

| Cookie | TTL | Set on |
|---|---|---|
| `access_token` | 15 minutes | signup, login, refresh |
| `refresh_token` | 7 days | signup, login, refresh |

Both cookies are cleared on `logout` and `invalidate-all`.

---

## Users (`/api/users`) — Planned

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | ✅ JWT (AFFILIATE) | Get own profile |
| PATCH | `/users/me` | ✅ JWT (AFFILIATE) | Update profile / bank details |
| POST | `/users/me/kyc` | ✅ JWT (AFFILIATE) | Submit KYC documents |
| GET | `/users` | ✅ JWT (ADMIN+) | List all affiliates |
| GET | `/users/:id` | ✅ JWT (ADMIN+) | Get affiliate by ID |
| PATCH | `/users/:id/status` | ✅ JWT (ADMIN+) | Suspend or deactivate user |
| PATCH | `/users/:id/kyc` | ✅ JWT (ADMIN+) | Approve/reject KYC |

---

## Commissions (`/api/commissions`) — Planned

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/commissions/me` | ✅ JWT (AFFILIATE) | Own commissions |
| GET | `/commissions` | ✅ JWT (ADMIN+) | All commissions |
| PATCH | `/commissions/:id/approve` | ✅ JWT (ADMIN+) | Approve commission |
| PATCH | `/commissions/:id/reject` | ✅ JWT (ADMIN+) | Reject commission |
| POST | `/commissions/manual` | ✅ JWT (SUPER_ADMIN) | Issue manual bonus |

---

## Businesses (`/api/businesses`) — Planned

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/businesses/me` | ✅ JWT (AFFILIATE) | Own referred businesses |
| POST | `/businesses` | ✅ JWT (AFFILIATE) | Register a new business referral |
| GET | `/businesses` | ✅ JWT (ADMIN+) | All businesses |
| PATCH | `/businesses/:id/status` | ✅ JWT (ADMIN+) | Update business status |

---

## Withdrawals (`/api/withdrawals`) — Planned

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/withdrawals/me` | ✅ JWT (AFFILIATE) | Own withdrawal requests |
| POST | `/withdrawals` | ✅ JWT (AFFILIATE, KYC=VERIFIED) | Create withdrawal request |
| GET | `/withdrawals` | ✅ JWT (ADMIN+) | All withdrawal requests |
| PATCH | `/withdrawals/:id/approve` | ✅ JWT (ADMIN+) | Approve withdrawal |
| PATCH | `/withdrawals/:id/reject` | ✅ JWT (ADMIN+) | Reject withdrawal |

---

## Training (`/api/training`) — Planned

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/training/modules` | ✅ JWT | List training modules |
| POST | `/training/modules/:id/complete` | ✅ JWT (AFFILIATE) | Mark module complete |
| GET | `/training/progress` | ✅ JWT (AFFILIATE) | Own training progress |

---

## Notifications (`/api/notifications`) — Planned

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/notifications` | ✅ JWT | Get own notifications |
| PATCH | `/notifications/:id/read` | ✅ JWT | Mark as read |
| PATCH | `/notifications/read-all` | ✅ JWT | Mark all as read |

---

## Standard Response Shapes

### Success

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Test User",
    "role": "AFFILIATE",
    "referralCode": "VEM-ABC123"
  }
}
```

### Error

NestJS default exception format:
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### Validation Error

```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be longer than 8 characters"],
  "error": "Bad Request"
}
```
