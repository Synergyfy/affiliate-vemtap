# Paystack Payment Architecture & Integration Standards — Vemtap Platform

This document defines mandatory rules, security requirements, and integration patterns for processing payments, subscriptions, and affiliate payouts via **Paystack** in the `affiliate-vemtap` monorepo.

---

## 🎯 Golden Rules for Paystack Integration

1. **NEVER Trust Client-Provided Amounts**: Frontend clients (`apps/web`) MUST NOT specify transaction amounts, plan rates, or commission fees. The backend (`apps/api`) MUST calculate prices strictly from database records.
2. **Amounts Must Be in Smallest Currency Unit (Kobo)**: Paystack expects amounts in kobo (smallest currency unit for NGN). Multiply Naira amounts by `100` and round to integer (e.g., ₦5,000 = `500000` kobo).
3. **Unique Transaction References**: Every transaction MUST generate a unique, non-repeating backend reference string (e.g. `VEM-TX-1718293041-A8F2`) stored in PostgreSQL before initializing Paystack.
4. **Mandatory HMAC SHA512 Webhook Verification**: Webhook endpoints MUST verify the `x-paystack-signature` header using HMAC SHA512 computed against the raw unparsed request buffer.
5. **Double Verification Strategy**: Never rely solely on frontend inline popup callback hooks. Always verify transactions via **Paystack Webhook (`charge.success`)** or **Server-to-Server Verification API (`GET /transaction/verify/:reference`)**.
6. **Zero Secrets on Client**: Paystack Secret Key (`PAYSTACK_SECRET_KEY`) MUST NEVER be exposed to the frontend (`apps/web`) or committed to Git repository files.

---

## 🏗️ Architecture & Service Structure

Paystack integration lives inside `apps/api/src/payments/`:

```
apps/api/src/payments/
├── providers/
│   └── paystack.service.ts   ← Paystack REST API wrapper (Initialize, Verify, Transfer, Banks)
├── dto/
│   ├── initialize-payment.dto.ts
│   ├── resolve-account.dto.ts
│   └── paystack-webhook.dto.ts
├── payments.controller.ts    ← Route handlers for checkout, account verification & webhooks
├── payments.module.ts        ← Module configuration & raw body middleware
└── payments.service.ts       ← Domain service (idempotency, DB records, balance updates)
```

---

## 💳 1. Payment Initialization & Backend Order Creation

### Workflow
1. Client requests checkout (`POST /api/payments/initialize`).
2. Server validates plan/item, generates unique reference `ref_...`, and creates a `PENDING` Payment record in database.
3. Server calls Paystack API (`POST /transaction/initialize`).
4. Server returns `authorization_url` and `access_code` to client.

```typescript
// apps/api/src/payments/providers/paystack.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.getOrThrow<string>('PAYSTACK_SECRET_KEY');
    this.http = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async initializeTransaction(params: {
    email: string;
    amountInNaira: number;
    reference: string;
    callbackUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<{ authorizationUrl: string; accessCode: string; reference: string }> {
    const amountInKobo = Math.round(params.amountInNaira * 100); // Convert NGN to Kobo

    try {
      const response = await this.http.post('/transaction/initialize', {
        email: params.email,
        amount: amountInKobo,
        reference: params.reference,
        callback_url: params.callbackUrl,
        metadata: params.metadata,
      });

      return {
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code,
        reference: response.data.data.reference,
      };
    } catch (error) {
      this.logger.error('Paystack initialization failed', error.response?.data || error.message);
      throw new BadRequestException('Failed to initialize payment gateway');
    }
  }

  async verifyTransaction(reference: string): Promise<any> {
    try {
      const response = await this.http.get(`/transaction/verify/${encodeURIComponent(reference)}`);
      return response.data.data;
    } catch (error) {
      this.logger.error(`Paystack transaction verification failed for ref ${reference}`, error.response?.data || error.message);
      throw new BadRequestException('Transaction verification failed');
    }
  }
}
```

---

## ⚓ 2. Paystack Webhook Verification (HMAC SHA512)

Paystack signs every webhook event using HMAC SHA512 with your `PAYSTACK_SECRET_KEY` in the `x-paystack-signature` header.

### Controller Implementation with Raw Body Validation

```typescript
// apps/api/src/payments/payments.controller.ts
import { Controller, Post, Req, Headers, BadRequestException, RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook/paystack')
  async handlePaystackWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string,
  ) {
    if (!signature || !req.rawBody) {
      throw new BadRequestException('Missing signature or raw request body');
    }

    // 1. Verify Paystack Signature using HMAC SHA512
    const secret = process.env.PAYSTACK_SECRET_KEY!;
    const hash = crypto
      .createHmac('sha512', secret)
      .update(req.rawBody)
      .digest('hex');

    // 2. Timing-safe comparison to prevent timing side-channel attacks
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(signature),
    );

    if (!isSignatureValid) {
      throw new BadRequestException('Invalid Paystack Webhook Signature');
    }

    const payload = JSON.parse(req.rawBody.toString('utf8'));

    // 3. Delegate to Idempotent Service Handler
    await this.paymentsService.processPaystackEvent(payload);

    // 4. Return HTTP 200 OK fast
    return { status: 'success' };
  }
}
```

---

## 🔄 3. Event Deduplication & Idempotent Processing

Paystack guarantees **at-least-once delivery**, meaning duplicate webhook events WILL arrive. Deduplicate using a `WebhookEventLog` table.

### Prisma Event Deduplication & Transaction Update

```typescript
// apps/api/src/payments/payments.service.ts
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processPaystackEvent(event: { event: string; data: any }): Promise<void> {
    const eventId = `paystack_${event.data.id || event.data.reference}`;

    // 1. Check if event was already processed
    const existingLog = await this.prisma.webhookEventLog.findUnique({
      where: { eventId },
    });

    if (existingLog) {
      this.logger.log(`Skipping duplicate Paystack event: ${eventId}`);
      return;
    }

    // 2. Process event inside database transaction
    await this.prisma.$transaction(async (tx) => {
      switch (event.event) {
        case 'charge.success': {
          await this.handleChargeSuccess(tx, event.data);
          break;
        }
        case 'transfer.success': {
          await this.handleTransferSuccess(tx, event.data);
          break;
        }
        case 'transfer.failed':
        case 'transfer.reversed': {
          await this.handleTransferFailed(tx, event.data);
          break;
        }
        default:
          this.logger.log(`Unhandled Paystack event type: ${event.event}`);
      }

      // 3. Log event ID to prevent duplicate executions
      await tx.webhookEventLog.create({
        data: {
          provider: 'PAYSTACK',
          eventId,
          eventType: event.event,
        },
      });
    });
  }

  private async handleChargeSuccess(tx: PrismaTransaction, data: any) {
    const reference = data.reference;
    const payment = await tx.payment.findUnique({ where: { reference } });
    if (!payment || payment.status === 'SUCCESS') return;

    // Update payment record to SUCCESS
    await tx.payment.update({
      where: { reference },
      data: { status: 'SUCCESS', paystackId: String(data.id) },
    });

    // Credit affiliate commission if applicable
    if (payment.affiliateId) {
      const commissionAmount = new Decimal(payment.amount).mul(0.15); // 15% commission rule
      await tx.commission.create({
        data: {
          userId: payment.affiliateId,
          amount: commissionAmount,
          status: 'EARNED',
          paymentReference: reference,
        },
      });
      await tx.user.update({
        where: { id: payment.affiliateId },
        data: { balance: { increment: commissionAmount } },
      });
    }
  }
}
```

---

## 💸 4. Bank Account Verification & Paystack Payout Transfers

For affiliate withdrawal payouts to Nigerian NUBAN bank accounts:

### Step 1 — Bank Account Resolution (NUBAN Verification)
Before adding or paying a bank account, resolve account details via Paystack:

```typescript
async resolveBankAccount(accountNumber: string, bankCode: string): Promise<{ accountName: string }> {
  try {
    const response = await this.http.get(
      `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`
    );
    return { accountName: response.data.data.account_name };
  } catch (error) {
    throw new BadRequestException('Could not resolve bank account details. Verify account number and bank code.');
  }
}
```

### Step 2 — Create Transfer Recipient & Execute Transfer

```typescript
async initiateWithdrawalPayout(withdrawalId: string): Promise<void> {
  const withdrawal = await this.prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
    include: { user: true },
  });

  if (!withdrawal || withdrawal.status !== 'PENDING') {
    throw new BadRequestException('Invalid or non-pending withdrawal request');
  }

  // 1. Create Transfer Recipient on Paystack
  const recipientRes = await this.http.post('/transferrecipient', {
    type: 'nuban',
    name: withdrawal.accountName,
    account_number: withdrawal.accountNumber,
    bank_code: withdrawal.bankCode,
    currency: 'NGN',
  });

  const recipientCode = recipientRes.data.data.recipient_code;
  const transferReference = `TR-${withdrawal.id.slice(0, 8)}-${Date.now()}`;

  // 2. Mark withdrawal as PROCESSING
  await this.prisma.withdrawal.update({
    where: { id: withdrawalId },
    data: { status: 'PROCESSING', reference: transferReference },
  });

  try {
    // 3. Initiate Transfer via Paystack
    await this.http.post('/transfer', {
      source: 'balance',
      amount: Math.round(withdrawal.amount.toNumber() * 100), // Kobo
      recipient: recipientCode,
      reason: `Vemtap Affiliate Payout - ${withdrawal.id}`,
      reference: transferReference,
    });
  } catch (error) {
    // 4. Revert state on transfer initiation failure
    await this.prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: 'FAILED', failureReason: error.message },
      });
      await tx.user.update({
        where: { id: withdrawal.userId },
        data: { balance: { increment: withdrawal.amount } },
      });
    });
    throw new BadRequestException(`Paystack transfer initiation failed: ${error.message}`);
  }
}
```

---

## 📋 Paystack Code Review Checklist

- [ ] Are prices and amounts calculated strictly on the backend (`apps/api`)?
- [ ] Are amounts converted to **Kobo (NGN × 100)** as integers?
- [ ] Is every transaction assigned a unique backend `reference` string before calling Paystack?
- [ ] Is raw body preservation (`rawBody: true`) enabled for `POST /payments/webhook/paystack`?
- [ ] Is HMAC SHA512 signature verification (`x-paystack-signature`) performed with `crypto.timingSafeEqual`?
- [ ] Is every webhook event ID logged in `WebhookEventLog` to prevent duplicate processing?
- [ ] Are NUBAN bank accounts validated via `/bank/resolve` before initiating affiliate payouts?
- [ ] Is `PAYSTACK_SECRET_KEY` kept in `.env` and omitted from frontend builds?
