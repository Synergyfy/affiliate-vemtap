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
| Role-based access guard (RolesGuard) | ✅ | Decorator + guard in `src/auth/guards/roles.guard.ts` |
| User status enforcement in JwtStrategy | ✅ | Blocked in `src/auth/strategies/jwt.strategy.ts` |

---

## User Management

| Feature | Status | Notes |
|---|---|---|
| User creation with referral code gen | ✅ | Format: VEM-XXXXXX |
| Referral chain linking (referrerId) | ✅ | Set on signup if sponsor code provided |
| View user profile info | ✅ | `GET /api/users/profile` |
| Update personal info | ✅ | `PATCH /api/users/profile` |
| Update bank details | ✅ | `PATCH /api/users/profile` |
| Update password | ✅ | `PATCH /api/users/profile` |
| Admin: list all affiliates | ✅ | `GET /api/users` |
| Admin: get affiliate by ID | ✅ | `GET /api/users/:id` |
| Admin: approve/reject KYC | ✅ | `PATCH /api/users/:id/kyc` |
| Admin: suspend/deactivate user | ✅ | `PATCH /api/users/:id/status` |

---

## Businesses

| Feature | Status | Notes |
|---|---|---|
| Register a new business referral | ✅ | `POST /api/businesses` |
| View own referred businesses | ✅ | `GET /api/businesses/me` |
| Admin: view all businesses | ✅ | `GET /api/businesses` |
| Admin: update business status | ✅ | `PATCH /api/businesses/:id/status` |
| Auto-trigger commission on business payment | ✅ | 15% Direct / 5% Manager Override |

---

## Network & Recruitment

| Feature | Status | Notes |
|---|---|---|
| List direct recruits | ✅ | `GET /api/network/recruits` |
| Network performance stats | ✅ | `GET /api/network/stats` |
| Milestone progress tracking | ✅ | 30 agents / 100 businesses |

---

## Marketing Tools

| Feature | Status | Notes |
|---|---|---|
| List tools | ✅ | `GET /api/tools` |
| Admin: manage tools | ✅ | CRUD on `/api/tools` |
| RolesGuard implementation | ✅ | Enforces Admin/SuperAdmin |

---

## Commissions

| Feature | Status | Notes |
|---|---|---|
| View own commissions | ✅ | `GET /api/commissions/me` |
| Admin: list all commissions | ✅ | `GET /api/commissions` |
| Admin: approve commission | ✅ | `PATCH /api/commissions/:id/status` |
| Admin: reject commission | ✅ | `PATCH /api/commissions/:id/status` |
| Super admin: issue manual bonus | 📋 | Planned in `CommissionsService` |
| Commission calculation (direct + indirect) | ✅ | Service logic in `BusinessesService` |

---

## Withdrawals

| Feature | Status | Notes |
|---|---|---|
| Create withdrawal request | ✅ | KYC-verified users only |
| View own withdrawals | ✅ | `GET /api/withdrawals/me` |
| Admin: list all withdrawals | ✅ | `GET /api/withdrawals` |
| Admin: approve/reject withdrawal | ✅ | `PATCH /api/withdrawals/:id/status` |
| Minimum withdrawal amount enforcement | ✅ | Business rule in service |
| Withdrawal fee calculation | ✅ | `netAmount = amount - fee` in `WithdrawalsService` |

---

## Training

| Feature | Status | Notes |
|---|---|---|
| List training modules | ✅ | `GET /api/training/modules` |
| Mark module complete | 📋 | `POST /api/training/modules/:id/complete` |
| View training progress | ✅ | `GET /api/training/progress` |

---

## Notifications

| Feature | Status | Notes |
|---|---|---|
| Get notifications | ✅ | `GET /api/notifications/me` |
| Mark as read | ✅ | `PATCH /api/notifications/:id/read` |
| Mark all as read | ✅ | `PATCH /api/notifications/read-all` |
| Real-time in-app notifications (WebSocket) | ✅ | `NotificationsGateway` on `/notifications` namespace |
| Push notifications (Web Push / VAPID) | ✅ | `PushService` + `PushSubscription` model + SW handler |
| Email notifications (Resend) | ✅ | Broadcast EMAIL channel + business reminders |
| Trigger notification on commission approval | 📋 | Planned in `CommissionsService` |

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

---

## Communication & Follow-up System

| Feature | Status | Notes |
|---|---|---|
| Prisma models (templates, campaigns, rules, messages, settings) | ✅ | Migration `20260819220219_add_communication_system` |
| Lead journey state denormalized fields | ✅ | Migration `20260819221101_add_lead_journey_state` |
| Message templates (CRUD, activate/deactivate/archive) | ✅ | `GET/POST /communication/templates` |
| SMS 160-char enforcement (after variable substitution) | ✅ | Templates + send path |
| Audience selection (status/salesperson/location/date) | ✅ | `GET /communication/audience/preview`, `/contacts` |
| WhatsApp assisted-send queue (deep link + mark-as-sent) | ✅ | `GET /communication/whatsapp/queue`, `POST .../mark-sent` |
| SMS provider abstraction + disabled no-op provider | ✅ | Pluggable `SmsProvider` interface |
| SMS send / schedule / retry | ✅ | `POST /communication/messages`, `POST /communication/sms/:id/retry` |
| Automation rules (trigger/wait/action) | ✅ | CRUD `/communication/rules` |
| Automation engine cron | ✅ | `EngineProcessor` (due SMS, still-interested, expiry, reconcile) |
| Subscription override (stop lead messages + welcome) | ✅ | `EngineService.onSubscribed` |
| Customer journey (welcome / tips / expiry) | ✅ | Rules with BEFORE_EXPIRY / AFTER_EXPIRY |
| Not-interested policy (NO_MESSAGES / RE_ENGAGEMENT) | ✅ | `CommunicationSettings.notInterestedPolicy` |
| Campaigns (audience fan-out + activate/pause) | ✅ | `GET/POST /communication/campaigns` |
| Communication settings (frequency limits, SMS toggle) | ✅ | `GET/PATCH /communication/settings` |
| Contact communication history + summary | ✅ | `GET /communication/messages/contacts/:leadId` |
| Sales team today's follow-ups | ✅ | `GET /communication/sales/today` |
| Admin overview + performance reporting | ✅ | `GET /communication/overview`, `/reporting` |
| Cross-module hooks (businesses/sales/leads → engine) | ✅ | Subscribed/status changes notify engine immediately |
| Unit tests (communication) | ✅ | 7 spec files, all passing |
| E2E tests (communication flow) | ✅ | `test/communication.e2e-spec.ts`, 5 tests passing (incl. IDOR) |

### Code Review Hardening

| Fix | Status | Notes |
|---|---|---|
| Centralized SMS dispatch (automation/welcome/campaign now actually send) | ✅ | `createMessages` dispatches immediate SMS synchronously; cron handles SCHEDULED |
| Configurable welcome channel + body | ✅ | Migration `20260819230036_add_welcome_channel_to_comm_settings` (`welcomeChannel`/`welcomeBody` on settings) |
| WhatsApp queue scoped to owner (salespeople own leads, admins global) | ✅ | `getQueue(user, ...)` |
| IDOR protection on messages/contact-profile/audience reads | ✅ | Non-admins scoped to own leads; 403 on cross-user access |
| Dedup interested-trigger (`ruleId + leadId`) | ✅ | Mirrors cron dedup |
| Correct `EXPIRED`/`LOST_CLOSED` audience filters | ✅ | `LOST_CLOSED` via pipeline exit state; `EXPIRED` matches nothing (business-level) |
| `BEFORE_EXPIRY` excludes EXPIRED/CANCELLED | ✅ | Only TRIAL businesses get renewal reminders |
| Redis distributed lock on engine crons | ✅ | `withLock` guard prevents cross-replica double-dispatch |

### Tech-Lead Review Remediation (2026-08-20)

| Fix | Status | Notes |
|---|---|---|
| `LEAD_CREATED` trigger wired | ✅ | `onLeadStatusChanged` fires immediate `LEAD_CREATED` rules; delayed ones handled by new `evaluateLeadCreated` cron. Was dead code before. |
| Multi-waitDays rule dispatch bug | ✅ | Crons now call `evaluateRule(rule, lead)` instead of re-running every rule of the trigger — prevents premature dispatch of longer-wait rules. |
| Subscription override ordering | ✅ | Welcome created before `BECAME_SUBSCRIBED` rule eval; cancellation is type-aware (`WELCOME`/`CUSTOMER_JOURNEY` protected) so the welcome can't self-cancel. |
| `markAsSent` IDOR | ✅ | Ownership enforced for non-admins (403 on other agents' messages); `createdById` column added and separated from `sentById` (migration `20260820000000_add_communication_created_by_and_lead_business_fk`). |
| Per-lead SMS length handling | ✅ | Bulk audience dispatch skips over-length renders instead of aborting the batch; explicit single sends still return 400. |
| Lead↔Business linkage | ✅ | `Lead.businessId` FK added; engine persists/uses the link and falls back to phone matching; nightly backfill cron reconciles unmapped leads. |
| Sales roles can start WhatsApp follow-ups | ✅ | `POST /communication/messages` open to sales roles for WhatsApp; SMS remains admin-only; audience/explicit-lead targets scoped to own/team leads. |
| Supervisor/Manager team scope | ✅ | Audience, WhatsApp queue, message history and sales-view resolve team member ids via `supervisedUsers`/`managedUsers`. |
| Campaign window respect | ✅ | WhatsApp scheduled to campaign `startAt` (flipped to PENDING by cron); campaigns past `endAt` are not fanned out. |
| Daily SMS cap handling | ✅ | Cron skips dispatch when the cap is reached instead of hot-retrying every minute; messages stay SCHEDULED for next day. |
| Starter templates seeded | ✅ | Idempotent seeding on module init; automation rules intentionally not auto-created (admin-driven, avoids surprise SMS cost). |

### Tech-Lead Review Remediation Round 2 (2026-08-20)

| Fix | Status | Notes |
|---|---|---|
| Audience status filter uses full per-status clause | ✅ | `buildWhereClause` ORs the full journey clause (status + OR + pipeline guards) — FOLLOW_UP_REQUIRED / LOST_CLOSED / EXPIRED now filter correctly instead of collapsing to a bare/empty `status` (was returning every lead). |
| Win-back (AFTER_EXPIRY) sends to subscribed-then-expired leads | ✅ | `resolveJourneyState` now resolves EXPIRED/CANCELLED before SUBSCRIBED; `CUSTOMER_JOURNEY_TRIGGERS` (BECAME_SUBSCRIBED / BECAME_NOT_INTERESTED / BEFORE_EXPIRY / AFTER_EXPIRY) bypass the lead-nurture terminal-state block and produce CUSTOMER_JOURNEY messages. |
| BEFORE_EXPIRY waitDays=0 semantics | ✅ | `waitDays=0` now means "expiring today" instead of matching the exact minute. |
| Re-engagement delay wired | ✅ | New `evaluateNotInterestedReEngagement` cron dispatches delayed BECAME_NOT_INTERESTED rules; `reEngagementDelayDays` + per-rule `waitDays` now usable. |
| SMS provider fault tolerance | ✅ | `provider.send` wrapped in try/catch → FAILED with the error; never aborts a batch or strands a message in PENDING. |
| FOLLOW_UP_REQUIRED reachable via sales pipeline | ✅ | `scheduleFollowUp` mirrors `nextFollowUpAt` onto the linked Lead so the journey reflects scheduled follow-ups. |
| Campaign double-activation guard + dedup | ✅ | Re-activating an ACTIVE campaign is a no-op; `campaignId+leadId+channel` dedup prevents duplicates. |
| Expiry cron uses businessId link | ✅ | Lead looked up via `businessId` first (phone fallback) + ordered (`createdAt asc`) to avoid starving older businesses. |
| Idempotent welcome | ✅ | Only one live WELCOME message per lead (PENDING/SCHEDULED/SENT) — concurrent hooks/cron can't double-send. |
| LEAD_CREATED nurture-only | ✅ | Immediate LEAD_CREATED rules fire only for LEAD_NURTURE_STATES; expired/lost leads never get "new contact" messages. |
| Empty message body rejected | ✅ | `SendMessageDto.body` now `@IsNotEmpty`. |
| Campaign count accuracy | ✅ | `eligibleContacts` reflects actual created messages, not raw lead matches. |
| Pre-existing lint blockers fixed | ✅ | Unused destructured vars in `market-mapping.service.ts` removed — `pnpm lint` now clean. |
| New unit tests | ✅ | 13 new tests: audience filters, team scope, win-back exemption, nurture terminal-block, EXPIRED ordering, welcome idempotency. |
