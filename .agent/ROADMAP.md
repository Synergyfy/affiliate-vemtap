# Feature Roadmap — Vemtap API

This file tracks what is built, what is in progress, and what is planned. Update this file when a feature is completed.

## Status Legend

| Symbol | Meaning |
|---|---|
| ✅ | Complete and tested |
| 🔄 | In progress |
| 📋 | Planned, not started |
| ⚠️ | Partially implemented, needs attention |

---

## Auth & Security

| Feature | Status | Notes |
|---|---|---|
| User registration (signup) | ✅ | `POST /api/auth/signup` |
| User login | ✅ | `POST /api/auth/login` |
| httpOnly cookie tokens | ✅ | access_token (15m) + refresh_token (7d) |
| Access token validation (JwtStrategy) | ✅ | Via passport-jwt + cookie extraction |
| Token refresh + rotation | ✅ | `POST /api/auth/refresh` |
| Global session invalidation | ✅ | tokenVersion bump on `POST /api/auth/invalidate-all` |
| Logout | ✅ | Cookie clearing on `POST /api/auth/logout` |
| Get current user | ✅ | `GET /api/auth/me` |
| Password hashing (bcrypt) | ✅ | Cost factor 10 |
| Password never returned in responses | ✅ | Enforced in UsersService |
| Role-based access guard (RolesGuard) | 📋 | Decorator + guard in `src/auth/` |
| User status enforcement in JwtStrategy | ⚠️ | DEACTIVATED/SUSPENDED not yet blocked at JWT level |

---

## User Management

| Feature | Status | Notes |
|---|---|---|
| User creation with referral code gen | ✅ | Format: VEM-XXXXXX |
| Referral chain linking (referrerId) | ✅ | Set on signup if sponsor code provided |
| View own profile | 📋 | `GET /api/users/me` |
| Update profile / bank details | 📋 | `PATCH /api/users/me` |
| KYC document submission | 📋 | `POST /api/users/me/kyc` |
| Admin: list all affiliates | 📋 | `GET /api/users` |
| Admin: get affiliate by ID | 📋 | `GET /api/users/:id` |
| Admin: approve/reject KYC | 📋 | `PATCH /api/users/:id/kyc` |
| Admin: suspend/deactivate user | 📋 | `PATCH /api/users/:id/status` |

---

## Businesses

| Feature | Status | Notes |
|---|---|---|
| Register a new business referral | 📋 | `POST /api/businesses` |
| View own referred businesses | 📋 | `GET /api/businesses/me` |
| Admin: view all businesses | 📋 | `GET /api/businesses` |
| Admin: update business status | 📋 | `PATCH /api/businesses/:id/status` |
| Auto-trigger commission on business payment | 📋 | Webhook or admin action |

---

## Commissions

| Feature | Status | Notes |
|---|---|---|
| View own commissions | 📋 | `GET /api/commissions/me` |
| Admin: list all commissions | 📋 | `GET /api/commissions` |
| Admin: approve commission | 📋 | `PATCH /api/commissions/:id/approve` |
| Admin: reject commission | 📋 | `PATCH /api/commissions/:id/reject` |
| Super admin: issue manual bonus | 📋 | `POST /api/commissions/manual` |
| Commission calculation (direct + indirect) | 📋 | Service logic |

---

## Withdrawals

| Feature | Status | Notes |
|---|---|---|
| Create withdrawal request | 📋 | KYC-verified users only |
| View own withdrawals | 📋 | `GET /api/withdrawals/me` |
| Admin: list all withdrawals | 📋 | `GET /api/withdrawals` |
| Admin: approve/reject withdrawal | 📋 | `PATCH /api/withdrawals/:id/approve` |
| Minimum withdrawal amount enforcement | 📋 | Business rule in service |
| Withdrawal fee calculation | 📋 | `netAmount = amount - fee` |

---

## Training

| Feature | Status | Notes |
|---|---|---|
| List training modules | 📋 | `GET /api/training/modules` |
| Mark module complete | 📋 | `POST /api/training/modules/:id/complete` |
| View training progress | 📋 | `GET /api/training/progress` |

---

## Notifications

| Feature | Status | Notes |
|---|---|---|
| Get notifications | 📋 | `GET /api/notifications` |
| Mark as read | 📋 | `PATCH /api/notifications/:id/read` |
| Mark all as read | 📋 | `PATCH /api/notifications/read-all` |
| Trigger notification on commission approval | 📋 | Service event |

---

## Infrastructure

| Feature | Status | Notes |
|---|---|---|
| Prisma schema defined | ✅ | All models present |
| Prisma migration applied | ✅ | `20260430082153_add_auth_system` |
| Test database setup script | ✅ | `scripts/create-test-db.ts` |
| Unit tests (auth + users) | ✅ | 12 tests passing |
| E2E tests (auth flow) | ✅ | 11 tests passing |
| Swagger docs | ✅ | `/docs` endpoint |
| CORS configured | ✅ | Supports credentials |
| Global validation pipe | ✅ | whitelist + transform |
