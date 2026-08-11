# Repository & Folder Structure — Vemtap Monorepo

This document outlines the folder structure, architectural boundaries, and naming conventions for the `affiliate-vemtap` repository.

---

## 🏗️ Monorepo Overview

This project is a monorepo managed with **pnpm workspaces** and **Turborepo**.

```
affiliate-vemtap/
├── .agent/                   ← Agent rules, standards & architectural docs (YOU ARE HERE)
├── .vscode/                  ← Workspace editor settings
├── apps/
│   ├── api/                  ← NestJS Backend API (Node.js, TypeScript, Prisma, PostgreSQL)
│   └── web/                  ← Next.js Frontend (React 18+, TypeScript, App Router, Tailwind)
├── docs/                     ← System design, integration guides, and specifications
├── scripts/                  ← Monorepo maintenance and database setup scripts
├── package.json              ← Root workspace configuration
├── pnpm-workspace.yaml       ← pnpm workspace directory definitions
├── turbo.json                ← Turborepo build & task execution pipeline configuration
├── docker-compose.yml        ← Local development PostgreSQL database service
└── README.md                 ← Project overview and getting started instructions
```

---

## 📦 `apps/api` — NestJS Backend Structure

The backend is built with **NestJS**, **Prisma ORM**, and **PostgreSQL**.

```
apps/api/
├── prisma/
│   ├── schema.prisma         ← Prisma data models, relations, indexes & database configuration
│   └── migrations/           ← Idempotent PostgreSQL migration SQL history
├── scripts/                  ← Database utility scripts (e.g., create-test-db.ts, seeders)
├── src/
│   ├── auth/                 ← Authentication module (login, signup, JWT tokens, cookies, refresh)
│   │   ├── dto/              ← Request validation DTOs (e.g., login.dto.ts, signup.dto.ts)
│   │   ├── guards/           ← Auth guards (JwtAuthGuard, RolesGuard)
│   │   ├── strategies/       ← Passport strategies (JwtStrategy, RefreshJwtStrategy)
│   │   ├── auth.controller.ts← Route handlers for /auth
│   │   ├── auth.module.ts    ← Auth module definition & dependencies
│   │   └── auth.service.ts   ← Auth business logic & password hashing
│   ├── users/                ← User management module (profiles, roles, KYC)
│   ├── commissions/          ← Commission calculation & tracking engine
│   ├── withdrawals/          ← Withdrawal request processing & payout verification
│   ├── businesses/           ← Business referral tracking & customer logs
│   ├── dashboard/            ← Aggregated metrics for Affiliates & Admins
│   ├── fraud/                ← Anti-fraud detection & suspicious activity flagging
│   ├── training/             ← Onboarding & educational modules for affiliates
│   ├── prisma/               ← Shared Prisma client module & database connection wrapper
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── common/               ← Shared decorators, filters, interceptors, and helpers
│   │   ├── decorators/       ← Custom param decorators (@CurrentUser(), @Roles())
│   │   ├── filters/          ← Global exception filters (HttpExceptionFilter)
│   │   └── interceptors/     ← Response formatting & logging interceptors
│   ├── app.module.ts         ← Root application module importing all feature modules
│   └── main.ts               ← Application bootstrap (Pipes, CORS, CookieParser, Swagger)
├── test/                     ← E2E test suites (*.e2e-spec.ts)
├── .env.example              ← Environment template for local development
├── package.json              ← API package dependencies & scripts
└── tsconfig.json             ← TypeScript compiler config for NestJS
```

### Module File Convention (NestJS)

Each domain feature must be encapsulated inside its own module:
- `*.module.ts` — Dependency injection declarations (`imports`, `controllers`, `providers`, `exports`).
- `*.service.ts` — Core business logic, data access, and database transaction processing.
- `*.controller.ts` — HTTP route controllers, DTO parsing, Guard applications, response handling.
- `dto/*.dto.ts` — Input contract schemas with `class-validator` and `class-transformer` decorators.
- `*.service.spec.ts` — Unit tests for service business logic.

---

## 🌐 `apps/web` — Next.js Frontend Structure

The frontend is built with **Next.js (App Router)**, **React**, and **Tailwind CSS**.

```
apps/web/
├── app/                      ← App Router pages and API routes
│   ├── (auth)/               ← Auth route group (login, register, forgot-password)
│   ├── (dashboard)/          ← Protected dashboard routes (affiliate, recruiter, admin)
│   ├── api/                  ← Next.js API routes / proxies
│   ├── layout.tsx            ← Root application layout
│   ├── page.tsx              ← Landing page / main gateway
│   └── globals.css           ← Global styles, Tailwind imports, dynamic theme variables
├── components/               ← Reusable React UI components
│   ├── ui/                   ← Core UI primitives (Button, Modal, Input, Card, Table)
│   ├── layout/               ← Structural components (Sidebar, Navbar, Header, Footer)
│   ├── dashboard/            ← Feature-specific components for dashboard metrics
│   └── forms/                ← Complex form implementations with validation
├── hooks/                    ← Custom React hooks (e.g., useAuth, useWithdrawals, useMediaQuery)
├── lib/                      ← Utility functions, API clients, constants, helpers
│   ├── api-client.ts         ← Axios/Fetch instance configured with credential handling
│   └── utils.ts              ← Formatting utilities (currency formatters, date formatters)
├── services/                 ← Frontend API service wrappers connecting to NestJS backend
├── types/                    ← Global TypeScript type definitions and API interfaces
├── proxy.ts                  ← Reverse proxy / middleware routing logic for backend communication
├── public/                   ← Static assets (logos, images, icons, fonts)
├── tailwind.config.js        ← Tailwind CSS design system tokens (colors, spacing, typography)
├── next.config.mjs           ← Next.js build and runtime configuration
└── package.json              ← Web package dependencies & scripts
```

---

## 🏷️ Naming & Code Conventions

| Entity Type | File Naming Convention | Symbol / Class Naming | Example File Path |
|---|---|---|---|
| NestJS Module | `kebab-case.module.ts` | `PascalCaseModule` | `src/users/users.module.ts` |
| NestJS Service | `kebab-case.service.ts` | `PascalCaseService` | `src/users/users.service.ts` |
| NestJS Controller | `kebab-case.controller.ts` | `PascalCaseController` | `src/users/users.controller.ts` |
| NestJS DTO | `kebab-case.dto.ts` | `PascalCaseDto` | `src/users/dto/create-user.dto.ts` |
| React Component | `kebab-case.tsx` | `PascalCase` | `components/ui/stat-card.tsx` |
| React Hook | `use-kebab-case.ts` | `useCamelCase` | `hooks/use-auth.ts` |
| Service Wrapper | `kebab-case.service.ts` | `camelCaseService` | `services/commissions.service.ts` |
| Utility File | `kebab-case.ts` | `camelCase` | `lib/format-currency.ts` |
| Database Migration | `YYYYMMDDHHMMSS_name` | `snake_case` | `prisma/migrations/20260501000000_add_kyc/` |

---

## 🚫 Module Boundaries & Import Rules

1. **API Dependency Boundary**:
   - Controllers MUST NOT access `PrismaService` directly.
   - Controllers call Services; Services access `PrismaService` or other domain Services.
   - Cross-module dependencies MUST be explicitly declared in NestJS `imports` and `exports`.

2. **Frontend Boundary**:
   - Direct database access from Next.js is forbidden. All data MUST pass through NestJS API endpoints (`apps/api`).
   - Use centralized API services in `apps/web/services/` or `lib/api-client.ts` rather than ad-hoc `fetch()` calls in individual UI components.

3. **Workspace Package Rule**:
   - Backend-specific packages (e.g., `@nestjs/common`, `@prisma/client`, `bcrypt`) MUST remain in `apps/api/package.json`.
   - Frontend-specific packages (e.g., `next`, `react`, `lucide-react`) MUST remain in `apps/web/package.json`.
