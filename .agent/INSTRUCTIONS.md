# Agent Instructions — Vemtap Affiliate API

This file is the **primary entry point** for any AI agent or developer working on this codebase. Read every file in this `.agent/` folder before making changes.

## Overview

This is a **NestJS monorepo** for the Vemtap Affiliate Management System. The workspace is managed with **pnpm workspaces** and **Turborepo**.

```
affiliate-vemtap/
├── apps/
│   ├── api/          ← NestJS backend (Node 20+, TypeScript)
│   └── web/          ← Next.js frontend (App Router)
├── .agent/           ← Agent documentation (you are here)
├── pnpm-workspace.yaml
└── turbo.json
```

## Mandatory Reading Order

Before writing any code, read these files **in order**:

1. `.agent/CONTEXT.md` — Business domain, data model, and feature map
2. `.agent/ARCHITECTURE.md` — Module structure, request lifecycle, patterns
3. `.agent/CONSTRAINTS.md` — What you must never do
4. `.agent/ROLES.md` — Auth roles and permission rules
5. `.agent/MIGRATIONS.md` — How to safely modify the database schema
6. `.agent/TESTING.md` — How to write and run tests

## Quick Start Commands

All commands are run from `apps/api/` unless noted.

| Command | Purpose |
|---|---|
| `pnpm dev` | Start dev server (from repo root) |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run E2E tests against test DB |
| `pnpm test:e2e:full` | Recreate test DB + run E2E tests |
| `pnpm test:db:setup` | Create/reset `vemtap-affiliate-test` DB |
| `pnpm prisma:migrate` | Apply new migration to main DB |
| `pnpm prisma:studio` | Open Prisma Studio GUI |
| `pnpm build` | Build for production (only when asked) |

## Key Principles

- **Never run `pnpm build`** unless the user explicitly requests it.
- **Never return the `password` field** in any API response.
- **Never commit secrets** — use `.env` (gitignored) not `.env.example`.
- **Always write tests** for new services and controllers.
- **Always use `pnpm`** — this project uses pnpm workspaces, not npm or yarn.
