# Vemtap Affiliate System - Backend Architecture Specification

## Overview

Vemtap is a Nigerian SaaS affiliate marketing platform enabling affiliates to earn commissions (20% direct, 5% indirect) by referring businesses to subscribe to Vemtap's NFC/QR technology services for customer retention.

**Frontend**: Next.js 15 App Router (already implemented)
**Backend**: NestJS (to be built)
**Database**: PostgreSQL with Prisma ORM
**Authentication**: JWT-based with refresh tokens

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ |
| Framework | NestJS 10+ |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (access + refresh tokens) |
| Validation | class-validator, class-transformer |
| API Docs | Swagger/OpenAPI |
| File Storage | Cloudinary/S3 (for KYC docs) |
| Queue | Bull (Redis) for async jobs |
| Cache | Redis |

---

## Database Schema

### Core Entities

```prisma
// User/Affiliate
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  phone           String    @unique
  password        String
  fullName        String
  
  referralCode    String    @unique  // e.g., "VEM-ABC123"
  referredBy      String?   // referralCode of referrer
  referrerId      String?
  referrer        User?     @relation("Referrals", fields: [referrerId], references: [id])
  referrals       User[]    @relation("Referrals")
  
  // KYC
  nin             String?
  bvn             String?
  bankName        String?
  accountNumber   String?
  accountName     String?
  kycStatus       KycStatus @default(PENDING)
  kycDocuments    Json?
  
  // Stats
  totalEarnings   Decimal   @default(0)
  pendingEarnings Decimal   @default(0)
  referralCount   Int       @default(0)
  
  // Status
  role            Role      @default(AFFILIATE)
  status          UserStatus @default(ACTIVE)
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastLoginAt     DateTime?
  
  // Relations
  businesses      Business[]
  commissions     Commission[]
  withdrawals     Withdrawal[]
  transactions    Transaction[]
  notifications   Notification[]
  trainingProgress TrainingProgress[]
  
  @@index([referralCode])
  @@index([referredBy])
}

enum Role {
  AFFILIATE
  ADMIN
  SUPER_ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DEACTIVATED
}

enum KycStatus {
  PENDING
  VERIFIED
  REJECTED
}

// Business Referral
model Business {
  id              String    @id @default(uuid())
  
  // Business Info
  businessName    String
  ownerName       String
  email           String
  phone           String
  address         String?
  businessType    String?
  planType        PlanType @default(BASIC)
  
  // Referral
  referralCode    String    // Code used for referral
  affiliateId     String
  affiliate       User       @relation(fields: [affiliateId], references: [id])
  
  // Commission
  subscriptionAmount Decimal
  commissionRate     Decimal  @default(0.20)
  commissionAmount    Decimal  @default(0)
  
  // Status
  status          BusinessStatus @default(TRIAL)
  trialEndsAt     DateTime?
  paidAt          DateTime?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([affiliateId])
  @@index([referralCode])
}

enum PlanType {
  BASIC      // Free trial
  STARTER    // ₦9,999/month
  PROFESSIONAL // ₦19,999/month
  ENTERPRISE // Custom
}

enum BusinessStatus {
  TRIAL
  ACTIVE
  EXPIRED
  CANCELLED
}

// Commission
model Commission {
  id              String    @id @default(uuid())
  
  userId          String
  user            User       @relation(fields: [userId], references: [id])
  
  businessId      String?
  business        Business?  @relation(fields: [businessId], references: [id])
  
  // Sub-affiliate referral (for indirect commissions)
  subAffiliateId  String?
  
  type            CommissionType
  amount          Decimal
  
  status          CommissionStatus @default(PENDING)
  paidAt          DateTime?
  
  description     String?
  
  createdAt       DateTime  @default(now())
  
  @@index([userId])
  @@index([businessId])
}

enum CommissionType {
  DIRECT      // 20% from direct referrals
  INDIRECT    // 5% from sub-affiliates
  BONUS       // Performance bonuses
}

enum CommissionStatus {
  PENDING
  APPROVED
  PAID
  REJECTED
}

// Withdrawal
model Withdrawal {
  id              String    @id @default(uuid())
  
  userId          String
  user            User       @relation(fields: [userId], references: [id])
  
  amount          Decimal
  fee             Decimal    @default(0)
  netAmount       Decimal
  
  bankName        String
  accountNumber   String
  accountName     String
  
  status          WithdrawalStatus @default(PENDING)
  adminNotes      String?
  processedAt     DateTime?
  processedBy     String?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([userId])
  @@index([status])
}

enum WithdrawalStatus {
  PENDING
  APPROVED
  PROCESSING
  PAID
  REJECTED
}

// Transaction
model Transaction {
  id              String    @id @default(uuid())
  
  userId          String
  user            User       @relation(fields: [userId], references: [id])
  
  type            TransactionType
  amount          Decimal
  balanceAfter    Decimal
  description     String?
  
  reference       String    @unique  // For payment verification
  
  createdAt       DateTime  @default(now())
  
  @@index([userId])
}

enum TransactionType {
  COMMISSION
  WITHDRAWAL
  REFERRAL_BONUS
  ADJUSTMENT
}

// Notification
model Notification {
  id              String    @id @default(uuid())
  
  userId          String?
  user            User?      @relation(fields: [userId], references: [id])
  
  type            NotificationType
  title           String
  message         String
  
  isRead          Boolean   @default(false)
  readAt          DateTime?
  
  data            Json?     // Additional payload
  
  createdAt       DateTime  @default(now())
  
  @@index([userId])
}

enum NotificationType {
  SYSTEM
  COMMISSION
  WITHDRAWAL
  KYC
  TRAINING
  PROMOTIONAL
}

// Training
model TrainingModule {
  id              String    @id @default(uuid())
  
  title           String
  description     String
  content         String    // Markdown/HTML content
  videoUrl        String?
  
  order           Int
  category        String
  
  isPublished     Boolean   @default(false)
  
  quizzes         Quiz[]
  scenarios       Scenario[]
  progress        TrainingProgress[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Quiz {
  id              String    @id @default(uuid())
  
  moduleId        String
  module          TrainingModule @relation(fields: [moduleId], references: [id])
  
  question        String
  options         Json      // ["Option A", "Option B", "Option C", "Option D"]
  correctAnswer   Int       // Index of correct option
  explanation     String?
  
  order           Int
}

model Scenario {
  id              String    @id @default(uuid())
  
  moduleId        String
  module          TrainingModule @relation(fields: [moduleId], references: [id])
  
  title           String
  situation       String    // Scenario description
  objection       String    // Customer objection
  idealResponse   String
  
  order           Int
}

model TrainingProgress {
  id              String    @id @default(uuid())
  
  userId          String
  user            User       @relation(fields: [userId], references: [id])
  
  moduleId        String
  module          TrainingModule @relation(fields: [moduleId], references: [id])
  
  status          ProgressStatus @default(NOT_STARTED)
  quizScore       Int?
  completedAt     DateTime?
  
  startedAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([userId, moduleId])
}

// Settings
model PlatformSettings {
  id              String    @id @default(uuid())
  
  directCommissionRate   Decimal @default(0.20)
  indirectCommissionRate Decimal @default(0.05)
  
  minWithdrawal           Decimal @default(5000)
  withdrawalFee           Decimal @default(100)
  
  subAffiliateUnlockCount Int    @default(5)
  
  fraudThresholdScore     Int    @default(80)
  
  referralUnlockCount     Int    @default(0) // Immediate unlock
  
  updatedAt               DateTime @updatedAt
}

// Fraud Alert
model FraudAlert {
  id              String    @id @default(uuid())
  
  userId          String
  
  type            FraudType
  severity        Severity
  
  description     String
  evidence        Json?
  
  status          FraudStatus @default(OPEN)
  resolvedAt      DateTime?
  resolvedBy      String?
  resolution      String?
  
  createdAt       DateTime  @default(now())
}

enum FraudType {
  MULTIPLE_ACCOUNTS
  FAKE_REFERRALS
  SELF_REFERRAL
  SUSPICIOUS_ACTIVITY
  KYC_MISMATCH
}

enum Severity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum FraudStatus {
  OPEN
  UNDER_REVIEW
  CONFIRMED
  FALSE_POSITIVE
  RESOLVED
}

// Audit Log
model AuditLog {
  id              String    @id @default(uuid())
  
  userId          String?
  adminId         String?
  
  action          String
  entity          String
  entityId        String?
  
  oldValue        Json?
  newValue        Json?
  
  ipAddress       String?
  userAgent       String?
  
  createdAt       DateTime  @default(now())
}
```

---

## Module Structure

```
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── roles.decorator.ts
│   │   └── public.decorator.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   └── fraud-check.guard.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── transform.interceptor.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   └── utils/
│       ├── generate-code.util.ts
│       └── hash.util.ts
├── config/
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── redis.config.ts
├── prisma/
│   └── prisma.module.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── signup.dto.ts
│   │   └── refresh-token.dto.ts
│   └── interfaces/
│       └── jwt-payload.interface.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── dto/
│   │   ├── update-profile.dto.ts
│   │   └── kyc-submission.dto.ts
│   └── entities/
│       └── user.entity.ts
├── businesses/
│   ├── businesses.module.ts
│   ├── businesses.controller.ts
│   ├── businesses.service.ts
│   ├── dto/
│   │   ├── create-business.dto.ts
│   │   └── business-query.dto.ts
│   └── entities/
│       └── business.entity.ts
├── commissions/
│   ├── commissions.module.ts
│   ├── commissions.controller.ts
│   ├── commissions.service.ts
│   ├── dto/
│   │   ├── commission-query.dto.ts
│   │   └── payout.dto.ts
│   └── entities/
│       └── commission.entity.ts
├── withdrawals/
│   ├── withdrawals.module.ts
│   ├── withdrawals.controller.ts
│   ├── withdrawals.service.ts
│   ├── dto/
│   │   ├── request-withdrawal.dto.ts
│   │   └── process-withdrawal.dto.ts
│   └── entities/
│       └── withdrawal.entity.ts
├── transactions/
│   ├── transactions.module.ts
│   ├── transactions.controller.ts
│   ├── transactions.service.ts
│   └── entities/
│       └── transaction.entity.ts
├── notifications/
│   ├── notifications.module.ts
│   ├── notifications.controller.ts
│   ├── notifications.service.ts
│   └── entities/
│       └── notification.entity.ts
├── training/
│   ├── training.module.ts
│   ├── training.controller.ts
│   ├── training.service.ts
│   ├── dto/
│   │   └── submit-quiz.dto.ts
│   └── entities/
│       ├── module.entity.ts
│       ├── quiz.entity.ts
│       └── scenario.entity.ts
├── admin/
│   ├── admin.module.ts
│   ├── admin.controller.ts
│   ├── admin.service.ts
│   ├── affiliate-management/
│   ├── commission-management/
│   ├── fraud-detection/
│   ├── broadcast-notifications/
│   └── platform-settings/
├── fraud/
│   ├── fraud.module.ts
│   ├── fraud.service.ts
│   └── fraud-detector.service.ts
├── referral/
│   ├── referral.module.ts
│   ├── referral.service.ts
│   └── referral-link.service.ts
├── leaderboard/
│   ├── leaderboard.module.ts
│   ├── leaderboard.controller.ts
│   └── leaderboard.service.ts
├── payment/
│   ├── payment.module.ts
│   ├── payment.controller.ts
│   └── payment.service.ts
└── queue/
    ├── queue.module.ts
    └── processors/
        ├── commission.processor.ts
        ├── withdrawal.processor.ts
        └── notification.processor.ts
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new affiliate |
| POST | `/auth/login` | Login with email/phone + password |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate refresh token |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |

### User/Affiliate

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current user profile |
| PATCH | `/users/me` | Update profile |
| POST | `/users/kyc` | Submit KYC documents |
| GET | `/users/kyc/status` | Check KYC verification status |
| GET | `/users/stats` | Get affiliate statistics |
| GET | `/users/network` | Get sub-affiliate network |
| GET | `/users/referral-link` | Get user's referral link/code |

### Businesses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/businesses` | List user's referred businesses |
| POST | `/businesses` | Register new business referral |
| GET | `/businesses/:id` | Get business details |
| PATCH | `/businesses/:id` | Update business info |
| GET | `/businesses/stats` | Get business referral stats |

### Commissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/commissions` | List user's commissions |
| GET | `/commissions/summary` | Get earnings summary |
| GET | `/commissions/:id` | Get commission details |

### Withdrawals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/withdrawals` | List user's withdrawals |
| POST | `/withdrawals` | Request withdrawal |
| GET | `/withdrawals/:id` | Get withdrawal status |
| GET | `/withdrawals/balance` | Get available balance |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/transactions` | List transaction history |
| GET | `/transactions/:id` | Get transaction details |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List user notifications |
| PATCH | `/notifications/:id/read` | Mark as read |
| PATCH | `/notifications/read-all` | Mark all as read |

### Training

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/training/modules` | List training modules |
| GET | `/training/modules/:id` | Get module with content |
| GET | `/training/modules/:id/quiz` | Get module quiz |
| POST | `/training/modules/:id/complete` | Mark module complete |
| POST | `/training/modules/:id/quiz` | Submit quiz answers |
| GET | `/training/progress` | Get user's progress |
| GET | `/training/leaderboard` | Training leaderboard |

### Leaderboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/leaderboard` | Get affiliate leaderboard |
| GET | `/leaderboard/me` | Get user's rank |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/overview` | Platform statistics |
| GET | `/admin/affiliates` | List all affiliates |
| GET | `/admin/affiliates/:id` | Get affiliate details |
| PATCH | `/admin/affiliates/:id/status` | Update affiliate status |
| GET | `/admin/businesses` | List all business referrals |
| GET | `/admin/commissions` | List all commissions |
| PATCH | `/admin/commissions/:id` | Update commission status |
| GET | `/admin/withdrawals` | List withdrawal requests |
| PATCH | `/admin/withdrawals/:id` | Process withdrawal |
| GET | `/admin/fraud-alerts` | List fraud alerts |
| PATCH | `/admin/fraud-alerts/:id` | Resolve fraud alert |
| POST | `/admin/notifications/broadcast` | Send bulk notification |
| GET | `/admin/settings` | Get platform settings |
| PATCH | `/admin/settings` | Update platform settings |
| GET | `/admin/audit-log` | View audit logs |

---

## Business Logic Flows

### 1. User Registration Flow

```
1. User submits signup form (email, phone, password, referralCode?)
2. Validate input with Zod/class-validator
3. Check if email/phone already exists
4. If referralCode provided, verify it exists and get referrerId
5. Hash password with bcrypt (12 rounds)
6. Generate unique referralCode (VEM-XXXXXX)
7. Create user record
8. Create welcome notification
9. Generate JWT tokens (access + refresh)
10. Return tokens + user profile
```

### 2. Business Referral & Commission Flow

```
1. Affiliate submits business details
2. Create Business record with TRIAL status
3. Calculate commission: businessAmount * directCommissionRate (20%)
4. Create PENDING Commission record
5. When business pays subscription:
   a. Update Business status to ACTIVE
   b. Update Commission status to APPROVED
   c. Add to user's pendingEarnings
   d. Create Transaction record
   e. Send notification to affiliate
6. Admin approves commission:
   a. Update Commission status to PAID
   b. Move from pendingEarnings to totalEarnings
   c. Credit wallet balance
```

### 3. Indirect Commission Flow (Sub-Affiliates)

```
1. User A refers User B (direct referral)
2. When User B refers a Business:
   a. User A gets INDIRECT commission (5%)
   b. Create Commission record with type: INDIRECT
3. Sub-affiliate network unlocks after 5 referrals
```

### 4. Withdrawal Flow

```
1. User requests withdrawal
2. Validate:
   - Balance >= minWithdrawal
   - No pending withdrawal
   - KYC verified
3. Deduct from pendingEarnings
4. Create Withdrawal record (PENDING)
5. Admin reviews and approves/rejects:
   - APPROVED: Move to PROCESSING
   - REJECTED: Refund to balance + notify user
6. Process payment (Flutterwave/Paystack integration)
7. Update status to PAID
8. Create final Transaction record
```

### 5. KYC Verification Flow

```
1. User submits KYC (NIN, BVN, bank details)
2. Validate NIN format (11 digits)
3. Validate BVN format (11 digits)
4. Validate bank account (10 digits)
5. Store documents securely
6. Admin reviews submission
7. Status: VERIFIED or REJECTED
8. Notify user of outcome
```

### 6. Fraud Detection Triggers

```
Monitor for:
- Multiple signups from same IP/device
- Self-referrals (same person as both referrer and referred)
- Rapid business submissions (spam)
- KYC mismatch (names don't match)
- Unusual commission patterns

Actions:
- Flag account for review
- Hold pending withdrawals
- Create FraudAlert record
- Notify admin dashboard
```

---

## Authentication & Authorization

### JWT Token Structure

```typescript
// Access Token Payload
interface JwtPayload {
  sub: string;        // User ID
  email: string;
  role: Role;
  iat: number;
  exp: number;       // 15 minutes
}

// Refresh Token Payload
interface RefreshPayload {
  sub: string;
  tokenVersion: number;
  iat: number;
  exp: number;       // 7 days
}
```

### Role-Based Access Control

| Role | Access |
|------|--------|
| AFFILIATE | Own profile, businesses, commissions, withdrawals, training |
| ADMIN | All above + affiliate management, withdrawals approval, fraud |
| SUPER_ADMIN | All above + settings, audit logs, platform config |

### Guards Implementation

```typescript
// Roles decorator
@Roles(Role.ADMIN, Role.SUPER_ADMIN)

// Guards check:
// 1. JWT valid and not expired
// 2. User account active
// 3. User role matches required role
// 4. (Optional) Fraud score below threshold
```

---

## Queue Jobs (Bull/Redis)

### Commission Processing Queue

```typescript
// Jobs:
// - calculateCommission: When business pays
// - processIndirectCommission: Credit parent affiliates
// - notifyCommissionPaid: Send notification

{
  name: 'calculateCommission',
  data: { businessId: string },
  opts: { attempts: 3, backoff: 5000 }
}
```

### Withdrawal Processing Queue

```typescript
// Jobs:
// - processWithdrawal: Call payment provider
// - checkWithdrawalStatus: Verify payment completion
// - refundRejectedWithdrawal: Return funds to balance

{
  name: 'processWithdrawal',
  data: { withdrawalId: string, userId: string },
  opts: { attempts: 3, backoff: 10000 }
}
```

### Notification Queue

```typescript
// Jobs:
// - sendEmail: Send transactional email
// - sendSms: Send SMS via Africa’s Talking
// - sendPush: Push notification

{
  name: 'broadcastNotification',
  data: { userIds: string[], notification: NotificationDTO },
  opts: { removeOnComplete: true }
}
```

---

## Third-Party Integrations

### Payment Providers (Nigerian Market)

```typescript
// Flutterwave or Paystack
interface PaymentProvider {
  initiateWithdrawal(params: {
    amount: number;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    reference: string;
  }): Promise<WithdrawalResponse>;
  
  verifyWithdrawal(reference: string): Promise<WithdrawalStatus>;
}
```

### SMS Provider

```typescript
// Africa's Talking or Termii
interface SmsProvider {
  send(to: string, message: string): Promise<SmsResponse>;
  sendBulk(recipients: string[], message: string): Promise<void>;
}
```

### KYC Verification

```typescript
// NIN verification: National Identity Number Commission API
// BVN verification: CBN BVN service
interface KycProvider {
  verifyNin(nin: string): Promise<{ valid: boolean; details?: NINDetails }>;
  verifyBvn(bvn: string, phone: string): Promise<{ valid: boolean; details?: BVNDetails }>;
}
```

---

## Security Considerations

1. **Password Security**
   - bcrypt with 12 rounds
   - Password complexity requirements
   - Rate limiting on login attempts

2. **JWT Security**
   - Short-lived access tokens (15 min)
   - HTTP-only cookies for refresh tokens
   - Token blacklisting on logout

3. **Input Validation**
   - All DTOs validated with class-validator
   - SQL injection prevention via Prisma
   - XSS prevention in user inputs

4. **Rate Limiting**
   - Auth endpoints: 5 requests/minute
   - API endpoints: 100 requests/minute
   - Business creation: 10/hour

5. **Audit Logging**
   - All admin actions logged
   - User sensitive actions logged
   - IP and user agent captured

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/vemtap"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"

# JWT
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"

# Payment Providers
FLUTTERWAVE_SECRET_KEY=""
FLUTTERWAVE_PUBLIC_KEY=""
PAYSTACK_SECRET_KEY=""

# SMS
AFRICAS_TALKING_API_KEY=""
AFRICAS_TALKING_USERNAME=""

# KYC
NIN_API_KEY=""
BVN_API_KEY=""

# App
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:3001"
```

---

## Development Phases

### Phase 1: Core Infrastructure
- [ ] NestJS project setup
- [ ] Prisma schema & migrations
- [ ] Authentication module (JWT)
- [ ] User module (CRUD, profile)
- [ ] Basic validation & error handling

### Phase 2: Affiliate Features
- [ ] Business referral module
- [ ] Commission calculation & tracking
- [ ] Wallet & earnings system
- [ ] Withdrawal requests
- [ ] Transaction history

### Phase 3: Advanced Features
- [ ] Training academy (modules, quizzes)
- [ ] Leaderboard system
- [ ] Notification system
- [ ] Referral link management
- [ ] Sub-affiliate network

### Phase 4: Admin & Security
- [ ] Admin dashboard APIs
- [ ] Fraud detection module
- [ ] Audit logging
- [ ] KYC verification
- [ ] Platform settings

### Phase 5: Integrations
- [ ] Payment provider integration
- [ ] SMS notifications
- [ ] KYC API integration
- [ ] Queue jobs (Bull)
- [ ] Redis caching

### Phase 6: Polish
- [ ] Rate limiting
- [ ] API documentation (Swagger)
- [ ] Unit & e2e tests
- [ ] Performance optimization
- [ ] Deployment configuration

---

## Testing Strategy

### Unit Tests
- Service methods with mocked repositories
- DTO validation
- Business logic (commission calculation, etc.)

### Integration Tests
- Database operations
- API endpoints
- Authentication flows

### E2E Tests
- Critical user journeys
- Admin workflows
- Payment flows

---

## Deployment

### Docker Setup
```dockerfile
# Backend
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/main.js"]
```

### Docker Compose
```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: vemtap
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

---

## Next Steps

1. Initialize NestJS project in `/backend` directory
2. Set up Prisma with the provided schema
3. Implement authentication module
4. Build core user/business modules
5. Integrate with frontend (already built)

For frontend integration, update API calls to point to NestJS backend at `http://localhost:3000`.
