# Zero-Downtime & Data-Safe Database Migrations — Vemtap API

This guide defines the standards for modifying database schemas in production without risking data loss, table locks, broken application instances, or downtime.

---

## 🚨 The Golden Rule of Database Migrations

> **Database migrations must ALWAYS be backward-compatible with currently running application code.**

In a continuous deployment environment:
1. **New database migrations run FIRST**.
2. **Old application instances are still handling user traffic** during the deployment window.
3. **New application instances start AFTER** the migration completes.

If a migration breaks old application code (e.g. dropping a column that the current server expects), requests WILL fail in production.

---

## 🔄 The 3-Phase Migration Pattern: Expand, Migrate, Contract

To safely make destructive changes (renaming columns, changing types, splitting tables, or deleting fields), split the work into **3 separate deployments**:

```
[Phase 1: EXPAND] ──> [Phase 2: MIGRATE / BACKFILL] ──> [Phase 3: CONTRACT]
  Add new field        Dual-write in code              Drop old field
  Keep old field       Backfill existing rows          Remove fallback code
```

---

## 🛠️ Safe Patterns for Common Operations

### 1. Adding a `NOT NULL` Column to an Existing Table

Adding a non-nullable column without a default to an existing table containing rows WILL fail or lock the database table.

#### ❌ Dangerous Approach
```prisma
// schema.prisma
model User {
  id      String @id @default(uuid())
  kycTier Int    // ❌ Fails on deploy if rows exist without kycTier!
}
```

#### ✅ Safe 2-Step Approach

**Step 1**: Add the field as optional (or with a `@default(...)`):
```prisma
model User {
  id      String @id @default(uuid())
  kycTier Int?   // ✅ Safe: nullable initially
}
```
Run `pnpm exec prisma migrate dev --name add_optional_kyc_tier`.

**Step 2**: Backfill existing rows with defaults, update code to set `kycTier` on creation.

**Step 3**: Make field `NOT NULL` in a subsequent migration once all rows are guaranteed populated:
```prisma
model User {
  id      String @id @default(uuid())
  kycTier Int    // ✅ Safe: all rows now have values
}
```

---

### 2. Renaming a Column

Prisma interprets column renames as **DROP COLUMN + ADD COLUMN**, which results in complete data loss for that field!

#### ❌ Dangerous Approach
Renaming `fullName` to `legalName` in `schema.prisma` generates:
```sql
ALTER TABLE "User" DROP COLUMN "fullName";
ALTER TABLE "User" ADD COLUMN "legalName" TEXT NOT NULL;
```

#### ✅ Safe Multi-Phase Approach

1. **Phase 1 (Expand)**: Add `legalName` as optional in Prisma schema.
2. **Phase 2 (Migrate & Write)**: 
   - Update NestJS code to write to **both** `fullName` and `legalName` simultaneously.
   - Run a backfill script to copy values: `UPDATE "User" SET "legalName" = "fullName" WHERE "legalName" IS NULL;`.
3. **Phase 3 (Read & Contract)**:
   - Update NestJS code to read exclusively from `legalName`.
   - Remove dual-writing logic.
   - Run migration to drop `fullName`.

---

### 3. Dropping a Column

Never drop a column immediately.

1. **Phase 1**: Mark column as deprecated in code and remove all references in NestJS services/DTOs.
2. **Phase 2**: Deploy application code. Confirm no active code queries the column.
3. **Phase 3**: Remove field from `schema.prisma` and deploy final migration.

---

### 4. Creating Indexes Safely on Large Tables

Standard index creation (`CREATE INDEX`) acquires a shared lock on the table, blocking writes until completion.

#### Custom SQL Migration for Big Tables
For tables with hundreds of thousands of rows (e.g. `commissions`, `customer_logs`), create empty migration (`--create-only`) and use `CONCURRENTLY`:

```bash
pnpm exec prisma migrate dev --name add_idx_commission_created_at --create-only
```

Edit the generated SQL file:
```sql
-- prisma/migrations/20260501_add_idx_commission_created_at/migration.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS "commission_created_at_idx" ON "Commission"("createdAt");
```

---

## 🔒 Verification Checklist Before Applying Migrations

Before merging any schema migration to `main`:

- [ ] Does this migration contain `DROP COLUMN` or `DROP TABLE`? If yes, verify old application code has been deployed without referencing these fields.
- [ ] Is a new required column added to an existing table without a `@default`? If yes, change to optional or provide a default value.
- [ ] Has the migration been tested on a copy of staging/production data volume?
- [ ] Are all new relational foreign key columns indexed (`@@index([userId])`)?
- [ ] Did you test `pnpm exec prisma migrate status` to confirm clean migration lock state?
