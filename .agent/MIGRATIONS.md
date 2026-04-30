# Database Migrations — Vemtap API

## Tools

| Tool | Purpose |
|---|---|
| `prisma migrate dev` | Create + apply a new migration in development |
| `prisma migrate deploy` | Apply pending migrations in production/CI (no new migration created) |
| `prisma db push` | **Test DB only** — push schema without migration history |
| `prisma migrate status` | Check which migrations are applied |
| `prisma studio` | Open GUI browser for the database |

---

## The Golden Rule

> **`prisma migrate dev` for development. `prisma migrate deploy` for production. Never anything else on a real database.**

---

## Workflow: Adding a New Field or Model

### Step 1 — Edit the Prisma schema

Edit `apps/api/prisma/schema.prisma`. Keep to these conventions:
- Use `uuid()` for all `@id` fields.
- Use `Decimal` for all monetary/financial values.
- Use `DateTime` with `@default(now())` for `createdAt`.
- Use `DateTime` with `@updatedAt` for `updatedAt`.
- Add `@@index([foreignKeyField])` for every relation field and commonly queried field.
- Add `?` for optional fields — prefer nullable over empty strings.

### Step 2 — Create the migration

Run from `apps/api/`:
```bash
pnpm exec prisma migrate dev --name <descriptive_name>
```

Use a descriptive, snake_case name that explains what changed:
```
# Good
pnpm exec prisma migrate dev --name add_kyc_document_url_to_user
pnpm exec prisma migrate dev --name create_training_module_table
pnpm exec prisma migrate dev --name add_status_index_to_commission

# Bad — too vague
pnpm exec prisma migrate dev --name update
pnpm exec prisma migrate dev --name fix
```

### Step 3 — Regenerate Prisma Client

This happens automatically after `migrate dev`, but if needed manually:
```bash
pnpm exec prisma generate
```

### Step 4 — Update affected services

After schema changes, update the corresponding NestJS service to use the new fields. Update DTOs if the field is user-facing.

### Step 5 — Update tests

If new required fields were added to a model, update the mock data in unit tests and the seed data in E2E tests.

---

## Workflow: Schema Changes That Affect E2E Tests

After a schema change, the test database must be re-synced:

```bash
pnpm test:db:setup
```

This script (`scripts/create-test-db.ts`):
1. Connects to PostgreSQL as admin.
2. Drops `vemtap-affiliate-test` if it exists.
3. Creates `vemtap-affiliate-test` fresh.
4. Runs `prisma db push --accept-data-loss` using `.env.test` credentials to apply the current schema.

---

## Workflow: Production Migrations (CI/CD)

In a CI/CD pipeline, apply migrations with:
```bash
DATABASE_URL=<prod_url> npx prisma migrate deploy
```

This command:
- Applies **only** pending migrations from `prisma/migrations/`.
- Does **not** generate new migrations.
- Does **not** modify the schema file.
- Is safe to run multiple times (idempotent for already-applied migrations).

---

## Dangerous Schema Operations — Handle with Care

These operations can cause **data loss** and require explicit `--accept-data-loss` or careful planning:

| Operation | Risk | Mitigation |
|---|---|---|
| Dropping a column | Permanent data loss | Back up data first; consider soft-deletes |
| Renaming a column | Prisma sees it as drop + add | Use a multi-step migration: add new → backfill → drop old |
| Changing a field type | May fail if data is incompatible | Cast in SQL; test on a copy of prod data |
| Adding a `NOT NULL` column to an existing table | Fails if rows exist without a value | Always add a `@default(...)` or do it in steps |

---

## Migration File Locations

```
apps/api/prisma/
├── schema.prisma         ← Source of truth for the data model
└── migrations/
    ├── 20260430082153_add_auth_system/
    │   └── migration.sql ← Auto-generated SQL
    └── migration_lock.toml
```

**Never edit `migration.sql` files manually.** If you need a custom SQL step (e.g., backfill data), create an empty migration:
```bash
pnpm exec prisma migrate dev --name backfill_referral_count --create-only
# Then edit the generated migration.sql before applying
pnpm exec prisma migrate dev
```

---

## Checking Migration Status

```bash
pnpm exec prisma migrate status
```

Output tells you which migrations are applied and which are pending. If a migration is listed as "not applied," run `migrate deploy` (prod) or `migrate dev` (local).
