# Preventing N+1 Query Problems — Vemtap Database Optimization

This guide outlines performance standards and query patterns to detect, prevent, and fix N+1 database queries when using Prisma ORM in NestJS and Next.js applications.

---

## ⚡ What is an N+1 Query Problem?

An **N+1 Query Problem** occurs when an application executes **1 query to fetch a list of N parent records**, and then executes **N separate additional queries to fetch child data for each individual record** (e.g., inside a `map` or `for` loop).

### The Classic Anti-Pattern ❌

```typescript
// ❌ WRONG: 1 query for users + 100 queries for user commissions (N+1 = 101 queries!)
const users = await this.prisma.user.findMany({ take: 100 });

const userSummaries = await Promise.all(
  users.map(async (user) => {
    // ⚠️ Executed 100 times in parallel! Causes database connection pool exhaustion!
    const commissions = await this.prisma.commission.findMany({
      where: { userId: user.id },
    });
    return { ...user, commissions };
  })
);
```

---

## 🛡️ Best Practice 1: Use Prisma Relational `include` or `select`

Prisma ORM resolves relationships in a single optimized database query (or batched SQL join) when using relational queries.

### ✅ Optimized Relational Query

```typescript
// ✅ CORRECT: Executed in 1-2 optimized queries TOTAL regardless of user count
const usersWithCommissions = await this.prisma.user.findMany({
  take: 100,
  select: {
    id: true,
    fullName: true,
    email: true,
    role: true,
    commissions: {
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    },
  },
});
```

---

## 🛡️ Best Practice 2: Batch Lookups with `in` Operators

When fetching related data across independent tables or services where relational queries cannot be directly nested, fetch all related records in **a single query using `in` conditions**.

### ❌ Anti-Pattern: Loop with individual queries

```typescript
// ❌ WRONG: 1 query for withdrawals + N queries to fetch user details
const withdrawals = await this.prisma.withdrawal.findMany({ take: 50 });

for (const w of withdrawals) {
  // ⚠️ N queries
  w.user = await this.prisma.user.findUnique({ where: { id: w.userId } });
}
```

### ✅ Correct Pattern: Batching with `in` and Map lookup

```typescript
// ✅ CORRECT: Exactly 2 queries TOTAL (1 for withdrawals, 1 for users)
const withdrawals = await this.prisma.withdrawal.findMany({ take: 50 });

// 1. Extract unique User IDs
const userIds = [...new Set(withdrawals.map((w) => w.userId))];

// 2. Fetch all required users in ONE single query
const users = await this.prisma.user.findMany({
  where: { id: { in: userIds } },
  select: { id: true, fullName: true, email: true, bankAccount: true },
});

// 3. Create a fast O(1) Lookup Map
const userMap = new Map(users.map((user) => [user.id, user]));

// 4. Attach users in memory without additional database roundtrips
const enrichedWithdrawals = withdrawals.map((w) => ({
  ...w,
  user: userMap.get(w.userId) || null,
}));
```

---

## 🛡️ Best Practice 3: DataLoader Pattern for Nested Graph Traversal

When building complex API responses (such as nested dashboard lists, GraphQL resolvers, or decoupled services), use the **DataLoader** pattern to automatically batch and cache database requests across a single request tick.

### Implementing DataLoader in NestJS

```typescript
import DataLoader from 'dataloader';
import { Injectable, Scope } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable({ scope: Scope.REQUEST }) // Scoped per HTTP Request
export class UserLoaderService {
  constructor(private readonly prisma: PrismaService) {}

  // Automatically batches individual load calls into 1 findMany({ where: { id: { in: ids } } }) query
  public readonly userByIdLoader = new DataLoader<string, SafeUser>(
    async (userIds: readonly string[]) => {
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds as string[] } },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));
      return userIds.map((id) => userMap.get(id) || null);
    }
  );
}
```

---

## 🛡️ Best Practice 4: Avoid Over-fetching with Targeted `select`

Fetching entire objects when only 1 or 2 fields are needed bloats memory and network overhead. Always specify exact fields using `select`.

```typescript
// ❌ WRONG: Selects all columns including large JSON blobs, unnecessary timestamps, and relations
const users = await this.prisma.user.findMany();

// ✅ CORRECT: Selects only necessary fields required by the UI/DTO contract
const users = await this.prisma.user.findMany({
  select: {
    id: true,
    fullName: true,
    referralCode: true,
  },
});
```

---

## 🔍 How to Spot N+1 Queries in Development

### 1. Enable Prisma Logging

In `apps/api/src/prisma/prisma.service.ts`, ensure database logging is active in development mode:

```typescript
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error'] 
        : ['error'],
    });
  }
}
```

### 2. Red Flag Indicators

Watch your terminal log output during API calls:
- 🚩 **Symptom 1**: A sudden flood of identical `SELECT` statements scrolling rapidly in the console.
- 🚩 **Symptom 2**: Query logs showing `prisma.commission.findUnique({ where: { id: "..." } })` executed 50+ times in a single HTTP response cycle.
- 🚩 **Symptom 3**: Latency scales linearly with record count (e.g., 10 records take 20ms, 1,000 records take 2,000ms).

---

## 📋 N+1 Checklist for Code Reviews

- [ ] Are there any database calls (`await prisma...`) inside a `.map()`, `forEach()`, `for...of`, or `while` loop?
- [ ] Are list responses fetching related entities using `include` or batched `in` queries?
- [ ] Is pagination enforced (`take` and `skip` / cursor pagination) on every list endpoint?
- [ ] Are all database foreign key fields indexed in `schema.prisma` (`@@index([userId])`) to ensure `in` queries execute using fast index scans?
