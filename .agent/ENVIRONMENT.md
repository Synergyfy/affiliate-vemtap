# Environment Configuration — Vemtap API

## Files

| File | Purpose | Committed? |
|---|---|---|
| `.env` | Local development secrets | ❌ No (gitignored) |
| `.env.example` | Template for new developers | ✅ Yes |
| `.env.test` | Test database configuration | ❌ No (gitignored) |

---

## Setting Up Locally

1. Copy the example file:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
2. Fill in your local values (DB password, JWT secrets, etc.).
3. Copy for test environment:
   ```bash
   cp apps/api/.env.example apps/api/.env.test
   # Change DATABASE_URL to point to vemtap-affiliate-test
   # Change PORT to 3002
   # Change NODE_ENV to test
   ```

---

## All Variables

### `apps/api/.env` (Development)

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/vemtap-affiliate"

# Redis (if used for queues/sessions)
REDIS_HOST="localhost"
REDIS_PORT="6379"

# JWT — use long random strings in production
JWT_SECRET="your-access-secret-here"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret-here"
JWT_REFRESH_EXPIRES_IN="7d"

# App
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

### `apps/api/.env.test` (Testing)

```env
# Test Database — separate from dev
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/vemtap-affiliate-test"

# JWT — can use dummy values for tests
JWT_SECRET="test-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="test-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"

# App
NODE_ENV="test"
PORT=3002
FRONTEND_URL="http://localhost:3000"
```

---

## Security Rules for Secrets

- **NEVER commit real secrets to git** — check `.gitignore` includes `.env` and `.env.test`.
- **Use strong random strings** for JWT secrets in production (min 32 chars):
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Rotate JWT secrets** periodically in production. After rotation, call `POST /auth/invalidate-all` or bump all users' `tokenVersion` to force re-login.
- **Separate secrets per environment** — never use development secrets in production.

---

## Production Environment Variables (Deploy Checklist)

Before deploying to production, ensure these are set in your hosting provider's secret manager:

- [ ] `DATABASE_URL` — production Postgres (SSL required: `?sslmode=require`)
- [ ] `JWT_SECRET` — strong random 64-char hex string
- [ ] `JWT_REFRESH_SECRET` — different strong random 64-char hex string
- [ ] `JWT_EXPIRES_IN` — `15m`
- [ ] `JWT_REFRESH_EXPIRES_IN` — `7d`
- [ ] `NODE_ENV` — `production`
- [ ] `FRONTEND_URL` — your production frontend URL (e.g., `https://app.vemtap.com`)
- [ ] `PORT` — as required by your hosting provider
