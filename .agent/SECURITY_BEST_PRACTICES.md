# Security Best Practices & Vulnerability Defense — Vemtap System

This document outlines mandatory security practices, authorization checks, credential management, and vulnerability prevention rules across the entire platform.

---

## 🔒 1. Authentication & Token Management

### HttpOnly Cookies (Never localStorage)
- Access and Refresh tokens MUST be stored exclusively inside `httpOnly`, `SameSite=Lax` (or `Strict`), `Secure` HTTP cookies set by `apps/api`.
- **NEVER** expose JWT tokens in JSON response bodies or write them to `localStorage` / `sessionStorage`.

```typescript
// ✅ CORRECT: Cookie configuration in AuthController
res.cookie('access_token', accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 15 * 60 * 1000, // 15 minutes
});
```

### Token Invalidation & Versioning
- Refresh tokens MUST include a `tokenVersion` counter stored on the `User` model.
- Password resets, security logouts, or compromised session revocations MUST increment `tokenVersion`, instantly invalidating all outstanding refresh tokens.

---

## 🔑 2. Password Security & Sanitization

1. **Password Hashing**: Always hash passwords using `bcrypt` with a minimum cost factor of 10 (`saltRounds = 10`).
2. **Password Leakage Prevention**:
   - Database queries fetching user objects MUST strip `password` before returning data to controllers or frontend clients.
   - Use Prisma `select` or TypeScript `Omit<User, 'password'>` across all services.

```typescript
// 🛡️ Safe User Extraction Helper
export function sanitizeUser<T extends { password?: string }>(user: T): Omit<T, 'password'> {
  const { password: _, ...safeUser } = user;
  return safeUser;
}
```

---

## 🛡️ 3. Authorization & Broken Object-Level Authorization (BOLA/IDOR)

NEVER trust IDs provided directly in request parameters (`/withdrawals/:id`) without validating resource ownership!

### ❌ Vulnerable Anti-Pattern (IDOR Vulnerability)
```typescript
// ❌ WRONG: Any authenticated user can view ANY withdrawal simply by altering the ID param!
@Get(':id')
async getWithdrawal(@Param('id') id: string) {
  return this.prisma.withdrawal.findUnique({ where: { id } });
}
```

### ✅ Secure Pattern (Ownership Validation)
```typescript
// ✅ CORRECT: Validates that the requested resource belongs to current authenticated user (or Admin)
@Get(':id')
async getWithdrawal(
  @Param('id') id: string,
  @CurrentUser() user: SafeUser,
) {
  const withdrawal = await this.prisma.withdrawal.findUnique({ where: { id } });
  if (!withdrawal) throw new NotFoundException('Withdrawal not found');

  if (withdrawal.userId !== user.id && user.role !== UserRole.ADMIN) {
    throw new ForbiddenException('You do not have permission to access this resource');
  }

  return withdrawal;
}
```

---

## 🗡️ 4. SQL Injection & XSS Defense

### SQL Injection Defense
- Prisma ORM uses parameterized queries automatically for all standard query methods (`findMany`, `create`, `update`).
- If custom raw SQL (`$queryRaw`) is required, ALWAYS use tagged template literals (`prisma.$queryRaw\`SELECT * FROM "User" WHERE email = ${email}\``) to enforce parameterization. NEVER string-concatenate raw SQL!

### XSS (Cross-Site Scripting) Defense
- All incoming user inputs (comments, profile names, business notes) MUST be validated and sanitized using `class-validator` decorators (`@IsString()`, `@SanitizeHtml()`).
- In Next.js, never use `dangerouslySetInnerHTML` unless rendering sanitized HTML from trusted internal sources.

---

## 🌐 5. CORS & Request Protection

### CORS Configuration
Limit origins explicitly in `apps/api/src/main.ts`:

```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});
```

---

## 🔑 6. Secrets & Environment Variables

1. **Zero Secret Commits**: NEVER commit API keys, private keys, database passwords, or JWT secrets to Git repository files.
2. **Environment Templates**: Keep dummy fallback values in `.env.example`. Keep active values in gitignored `.env` files.
3. **Validation**: Use `config` module or Zod schema validation on application bootstrap to fail fast if required secrets are missing.

---

## 🛡️ Security Checklist for Code Reviews

- [ ] Does any new endpoint return `password` or sensitive credentials?
- [ ] Are parameter IDs (`:id`) checked against `currentUser.id` or user role?
- [ ] Are all controller DTOs decorated with `class-validator` validation rules?
- [ ] Are CORS settings restricting origins to trusted frontend domains?
- [ ] Are tokens handled strictly via `httpOnly` cookies?
