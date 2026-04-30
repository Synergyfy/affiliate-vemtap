# Architecture — Vemtap API

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | NestJS 10 |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| Auth | JWT (passport-jwt) + httpOnly Cookies |
| Validation | class-validator + class-transformer |
| Docs | Swagger / OpenAPI (`/docs`) |
| Testing | Jest + Supertest |
| Package Manager | pnpm (workspaces) |
| Build Tool | Turborepo |

---

## Module Structure

Every feature lives in its own **NestJS module** under `apps/api/src/`:

```
src/
├── main.ts               ← Bootstrap: CORS, cookies, validation pipe, Swagger, global prefix
├── app.module.ts         ← Root module, imports all feature modules
├── prisma/
│   ├── prisma.module.ts  ← Global PrismaModule (exported for all modules)
│   └── prisma.service.ts ← PrismaClient singleton, onModuleInit/onModuleDestroy
├── auth/
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── dto/              ← login.dto.ts
│   ├── guards/           ← jwt-auth.guard.ts
│   ├── strategies/       ← jwt.strategy.ts
│   └── decorators/       ← current-user.decorator.ts
└── users/
    ├── users.module.ts
    ├── users.service.ts
    └── dto/              ← create-user.dto.ts
```

### Module Creation Rule

When adding a new feature (e.g., `commissions`):
1. Create `src/commissions/` with the standard files.
2. Add `CommissionsModule` to `AppModule` imports.
3. Import `PrismaModule` — it is global, so **do NOT re-import it** inside feature modules.
4. Export any service that other modules will consume.

---

## Request Lifecycle

```
HTTP Request
  → main.ts (cookieParser middleware)
  → main.ts (ValidationPipe — whitelist + transform)
  → Router → Controller
  → Guard (e.g., JwtAuthGuard → JwtStrategy → UsersService.findById)
  → Controller method
  → Service
  → PrismaService (DB)
  → Response (serialized, password stripped)
```

---

## Auth Architecture

- **Access Token**: JWT, 15-minute lifetime, signed with `JWT_SECRET`.
- **Refresh Token**: JWT, 7-day lifetime, signed with `JWT_REFRESH_SECRET`. Contains `tokenVersion`.
- Both tokens are stored in **`httpOnly` cookies** (never in `localStorage`).
- Token rotation is enforced: every `/auth/refresh` call validates `tokenVersion` against the DB.
- Invalidation: calling `/auth/invalidate-all` increments `user.tokenVersion`, immediately invalidating all existing refresh tokens globally.

### Cookie Names

| Cookie | Lifetime |
|---|---|
| `access_token` | 15 minutes |
| `refresh_token` | 7 days |

### Protecting Routes

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@CurrentUser() user: SafeUser) { ... }
```

The `@CurrentUser()` decorator returns the user object from `request.user` as set by `JwtStrategy.validate()`. The `password` field is **never included** in this object.

---

## Prisma Conventions

- **All DB access** goes through `PrismaService` — never raw `pg` queries in business logic.
- **Always strip `password`** when returning user data. Use destructuring or `Omit<User, 'password'>`.
- **Use `@@index`** on all foreign keys and commonly filtered fields.
- **Use `uuid()`** for all primary keys.
- **`Decimal` type** for all monetary values — never `Float`.

---

## API Global Prefix

All routes are prefixed with `/api`. Example: `POST /api/auth/login`.

---

## DTOs and Validation

- Every controller input must use a **DTO class** decorated with `class-validator`.
- Use `@IsString()`, `@IsEmail()`, `@IsOptional()`, `@MinLength()` etc.
- The global `ValidationPipe` with `whitelist: true` strips any undeclared properties automatically.

---

## Error Handling

Use NestJS built-in exceptions — **never return raw error objects**:

```typescript
throw new NotFoundException('User not found');
throw new ConflictException('Email already exists');
throw new UnauthorizedException('Invalid credentials');
throw new ForbiddenException('Insufficient permissions');
throw new BadRequestException('Invalid input');
```

---

## Swagger Documentation

Every controller method should have `@ApiOperation({ summary: '...' })`.
Every DTO should have `@ApiProperty()` decorators on public fields.
Swagger UI is available at `/docs` in development.
