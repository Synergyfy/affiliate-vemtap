# Database Backfilling Standard Operating Procedure — Vemtap API

This guide provides standards, algorithms, and production script templates for backfilling or transforming database records safely in PostgreSQL using Prisma.

---

## 🎯 Backfilling Core Rules

When updating thousands or millions of database records in production:

1. **NEVER process all rows in a single query or single memory array**.
2. **ALWAYS chunk/batch operations** (e.g. 100 to 1,000 records per transaction batch).
3. **ALWAYS ensure scripts are idempotent** (safe to run multiple times without duplicating side effects).
4. **ALWAYS provide a `--dry-run` mode** to inspect actions before modifying production data.
5. **ALWAYS log progress** (e.g., `Processed 5,000 / 50,000 (10%)`).
6. **NEVER run backfill scripts directly inside NestJS application lifecycle startup**.

---

## 📐 Chunking & Batching Algorithm

Iterate through database records using **Cursor-Based Pagination** or **ID range pagination** to avoid loading huge datasets into RAM or acquiring long-held database locks.

```typescript
// ❌ WRONG: Memory overflow + DB transaction timeout!
const users = await prisma.user.findMany();
for (const u of users) {
  await prisma.user.update({ where: { id: u.id }, data: { ... } });
}

// ✅ CORRECT: Cursor-based chunking with batch size = 500
let cursor: string | undefined = undefined;
let totalProcessed = 0;
const BATCH_SIZE = 500;

while (true) {
  const users = await prisma.user.findMany({
    take: BATCH_SIZE,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    where: { needsBackfill: true }, // Filter to pending records
    orderBy: { id: 'asc' },
  });

  if (users.length === 0) break;

  // Process batch inside a isolated transaction
  await prisma.$transaction(async (tx) => {
    for (const user of users) {
      await tx.user.update({
        where: { id: user.id },
        data: { referralCode: generateCode(user.fullName), needsBackfill: false },
      });
    }
  });

  totalProcessed += users.length;
  cursor = users[users.length - 1].id;
  console.log(`Processed ${totalProcessed} records...`);
}
```

---

## 🤖 Production Backfill Script Template

Place backfill CLI scripts inside `apps/api/scripts/`.

Create a boilerplate script file (e.g., `apps/api/scripts/backfill-referral-codes.ts`):

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Logger } from '@nestjs/common';

async function runBackfill() {
  const logger = new Logger('BackfillScript');
  const isDryRun = process.argv.includes('--dry-run');

  logger.log(`Starting backfill operation (Dry Run: ${isDryRun})...`);

  // Initialize standalone NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  const BATCH_SIZE = 250;
  let processedCount = 0;
  let cursor: string | undefined = undefined;

  try {
    while (true) {
      const records = await prisma.user.findMany({
        take: BATCH_SIZE,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        where: { referralCode: null }, // Target unpopulated records only
        orderBy: { id: 'asc' },
      });

      if (records.length === 0) {
        logger.log('No remaining records to backfill.');
        break;
      }

      logger.log(`Processing batch of ${records.length} records...`);

      if (!isDryRun) {
        await prisma.$transaction(async (tx) => {
          for (const record of records) {
            const newCode = `VEM-${record.id.slice(0, 6).toUpperCase()}`;
            await tx.user.update({
              where: { id: record.id },
              data: { referralCode: newCode },
            });
          }
        });
      } else {
        logger.log(`[DRY RUN] Would update ${records.length} records.`);
      }

      processedCount += records.length;
      cursor = records[records.length - 1].id;

      // Yield control briefly to prevent CPU lockup
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    logger.log(`Backfill completed successfully. Total processed: ${processedCount}`);
  } catch (error) {
    logger.error('Backfill failed with error:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

runBackfill();
```

---

## 🏃 Executing Backfill Scripts

Run backfill scripts via `ts-node` or `pnpm exec ts-node` from `apps/api/`:

```bash
# 1. Always execute dry-run first
pnpm exec ts-node scripts/backfill-referral-codes.ts --dry-run

# 2. Execute live backfill on development/staging DB
pnpm exec ts-node scripts/backfill-referral-codes.ts

# 3. Production execution in CI/CD pipeline or SSH shell
DATABASE_URL="postgresql://..." pnpm exec ts-node scripts/backfill-referral-codes.ts
```

---

## 🔒 Backfill Checklist

- [ ] Is the query restricted only to records needing updates (`where: { targetField: null }`)?
- [ ] Is the script idempotent (can it run twice safely without corrupting data)?
- [ ] Is `--dry-run` flag implemented and tested?
- [ ] Is the batch size kept between 100 and 1,000 to prevent database connection timeouts?
- [ ] Are logs emitting current progress to monitor long-running backfills?
