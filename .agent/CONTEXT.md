# Business Context — Vemtap Affiliate System

## What Is This?

Vemtap is a **multi-level affiliate marketing platform** that allows affiliates to earn commissions by referring businesses to subscribe to Vemtap's services. Affiliates can also recruit sub-affiliates and earn indirect (level-2) commissions from their referrals.

## Core Business Concepts

| Concept | Description |
|---|---|
| **Affiliate** | A registered user who refers businesses and earns commissions |
| **Business** | A client company referred by an affiliate; they pay a subscription fee |
| **Commission** | A monetary reward paid to an affiliate when their referred business pays |
| **Referral Chain** | An affiliate can be recruited by another affiliate (referrerId) — creating a 2-level tree |
| **Withdrawal** | An affiliate requests to withdraw their earned balance to a bank account |
| **KYC** | Know Your Customer — affiliates must verify identity before withdrawing |
| **Training** | Onboarding modules affiliates must complete to unlock features |

## Commission Structure

- **Direct Commission**: Earned when a business you directly referred makes a payment (e.g., 20% of subscription).
- **Indirect Commission**: Earned from a referred affiliate's business referrals (reduced rate, e.g., 5%).
- **Bonus Commission**: Admin-issued, one-off commissions.

## Affiliate Referral Code

Every affiliate is assigned a unique `referralCode` (format: `VEM-XXXXXX`) at signup. This code is used:
- By new affiliates signing up under a sponsor.
- By businesses when they are registered, linking them back to the affiliate.

## User Roles

See `ROLES.md` for full role definitions and permission rules.

## Data Model Summary

The Prisma schema at `apps/api/prisma/schema.prisma` defines these primary models:

| Model | Purpose |
|---|---|
| `User` | Affiliates and admins. Contains earnings, KYC, referral, and auth fields |
| `Business` | A referred business linked to an affiliate |
| `Commission` | Tracks every commission event |
| `Withdrawal` | Withdrawal requests and their lifecycle |
| `Transaction` | Payment and credit history |
| `Notification` | In-app alerts for affiliates |
| `TrainingProgress` | Tracks which modules an affiliate has completed |

## Key Enums

```
Role:             AFFILIATE | ADMIN | SUPER_ADMIN
UserStatus:       ACTIVE | SUSPENDED | DEACTIVATED
KycStatus:        PENDING | VERIFIED | REJECTED
BusinessStatus:   TRIAL | ACTIVE | EXPIRED | CANCELLED
PlanType:         BASIC | STARTER | PROFESSIONAL | ENTERPRISE
CommissionType:   DIRECT | INDIRECT | BONUS
CommissionStatus: PENDING | APPROVED | PAID | REJECTED
WithdrawalStatus: PENDING | APPROVED | PROCESSING | PAID | REJECTED
```

## Frontend Pages (apps/web)

Key pages the backend must support:

| Route | Description |
|---|---|
| `/signup` | New affiliate registration (fullName, email, phone, password, optional referralCode) |
| `/login` | Affiliate login (email or phone + password) |
| `/dashboard` | Affiliate dashboard — earnings, referrals, commissions |
| `/profile` | KYC submission, bank details update |
| `/training` | Onboarding modules |
| `/withdrawals` | Request and track withdrawals |

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Primary PostgreSQL connection string |
| `JWT_SECRET` | Access token signing key (15m lifetime) |
| `JWT_REFRESH_SECRET` | Refresh token signing key (7d lifetime) |
| `JWT_EXPIRES_IN` | Access token TTL (default: `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (default: `7d`) |
| `FRONTEND_URL` | Allowed CORS origin |
| `NODE_ENV` | `development` / `production` / `test` |
| `PORT` | API port (default: 3001) |
