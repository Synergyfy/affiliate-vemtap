# Vemtap Affiliate System

A monorepo containing the Vemtap Affiliate Management System with:

- **apps/web** - Next.js 15 frontend (admin dashboard + affiliate portal)
- **apps/api** - NestJS backend API (to be implemented)

## Tech Stack

| App | Framework | Purpose |
|-----|-----------|---------|
| web | Next.js 15 | User-facing dashboard, admin panel |
| api | NestJS 10 | REST API, business logic |

**Monorepo Tools:** pnpm workspaces + Turbo

## Project Structure

```
.
├── apps/
│   ├── api/               # NestJS backend
│   │   ├── prisma/        # Database schema & client
│   │   ├── src/           # Source code
│   │   └── ...
│   └── web/               # Next.js frontend
│       ├── app/           # App Router pages
│       ├── components/    # React components
│       ├── hooks/         # Custom hooks
│       └── ...
├── package.json           # Root workspace config
├── pnpm-workspace.yaml   # pnpm workspaces
├── turbo.json            # Turbo pipeline config
└── tsconfig.json         # Root TypeScript config
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+
- Docker (optional for PostgreSQL)

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
cd apps/api && pnpm prisma:generate
```

### Database Setup

1. Create a PostgreSQL database:
```bash
docker run -d --name vemtap-db \
  -e POSTGRES_DB=vemtap \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 postgres:15
```

2. Copy environment file and update:
```bash
cd apps/api
cp .env.example .env
# Edit .env with your DATABASE_URL
```

3. Run migrations:
```bash
cd apps/api
pnpm prisma:migrate
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run specific app
pnpm --filter @vemtap/web dev
pnpm --filter @vemtap/api dev
```

### Build

```bash
# Build all apps
pnpm build

# Build specific app
pnpm --filter @vemtap/web build
pnpm --filter @vemtap/api build
```

## API Documentation

Once running, access Swagger docs at: http://localhost:3001/docs

## Environment Variables

### apps/api/.env

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all apps |
| `pnpm clean` | Clean build artifacts |

## Backend Architecture

See [backend-architecture.md](./apps/web/backend-architecture.md) for the full backend specification.

## License

Private
