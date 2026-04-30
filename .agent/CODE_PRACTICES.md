# Code Practices — Vemtap API

## TypeScript

### Use strict types — avoid `any`

```typescript
// ✅ Good
async findById(id: string): Promise<Omit<User, 'password'> | null>

// ❌ Bad
async findById(id: any): Promise<any>
```

### Use `Omit<>` for safe user types

Define a reusable type for user objects without password:
```typescript
type SafeUser = Omit<User, 'password'>;
```

### Prefer `async/await` over `.then()`

```typescript
// ✅ Good
const user = await this.prisma.user.findUnique({ where: { id } });

// ❌ Bad
this.prisma.user.findUnique({ where: { id } }).then(user => { ... });
```

---

## NestJS Module Conventions

### One module per feature domain

```
src/
├── auth/           ← Auth (login, signup, tokens)
├── users/          ← User management
├── commissions/    ← Commission tracking
├── withdrawals/    ← Withdrawal requests
├── businesses/     ← Business referrals
└── training/       ← Training modules
```

### Module file checklist

Every feature module should have:
- `*.module.ts` — imports, providers, exports
- `*.service.ts` — business logic and DB access
- `*.controller.ts` — HTTP routing, validates input, delegates to service
- `dto/*.dto.ts` — request body types with class-validator decorators
- `*.service.spec.ts` — unit tests

Optional (add when needed):
- `guards/*.guard.ts` — custom guards
- `decorators/*.decorator.ts` — custom parameter decorators
- `entities/*.entity.ts` — response type classes for Swagger

### Always export services that other modules need

```typescript
@Module({
  providers: [UsersService],
  exports: [UsersService], // ← required for cross-module use
})
export class UsersModule {}
```

---

## Controllers

### Keep controllers thin

Controllers should only:
1. Parse and validate the request (via DTOs and Guards).
2. Call the appropriate service method.
3. Set cookies or headers if needed.
4. Return the response.

```typescript
// ✅ Good — thin controller
@Post('signup')
async signup(@Body() dto: CreateUserDto, @Res({ passthrough: true }) res: Response) {
  const { accessToken, refreshToken, user } = await this.authService.signup(dto);
  this.setCookies(res, accessToken, refreshToken);
  return { user };
}

// ❌ Bad — business logic in controller
@Post('signup')
async signup(@Body() dto: CreateUserDto) {
  const hash = await bcrypt.hash(dto.password, 10); // wrong place
  const user = await this.prisma.user.create({ ... }); // wrong place
  return user;
}
```

### Use `passthrough: true` with `@Res()`

When you need to set cookies but still want NestJS to handle the response serialization:
```typescript
async login(@Res({ passthrough: true }) res: Response) { ... }
```

Without `passthrough: true`, you must call `res.json()` or `res.send()` manually.

---

## Services

### Single responsibility

Each service owns one domain. `UsersService` handles user CRUD. It does NOT handle token generation — that belongs in `AuthService`.

### Error handling in services

Throw NestJS exceptions, not raw errors:
```typescript
if (!user) throw new NotFoundException(`User ${id} not found`);
if (exists) throw new ConflictException('Email already registered');
```

### Always strip passwords before returning

```typescript
async findById(id: string): Promise<Omit<User, 'password'> | null> {
  const user = await this.prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  const { password: _, ...safe } = user;
  return safe;
}
```

---

## DTOs

### Use class-validator decorators

```typescript
import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  phone: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referralCode?: string;
}
```

---

## Prisma Query Patterns

### Use `select` to avoid fetching sensitive fields at the DB level

When possible, tell Prisma what to select rather than stripping in code:
```typescript
const user = await this.prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    fullName: true,
    role: true,
    referralCode: true,
    // password is NOT listed
  },
});
```

### Use transactions for multi-step operations

When multiple DB writes must succeed or fail together:
```typescript
await this.prisma.$transaction(async (tx) => {
  await tx.commission.create({ data: commissionData });
  await tx.user.update({
    where: { id: userId },
    data: { totalEarnings: { increment: amount } },
  });
});
```

### Use `findFirst` with `OR` for lookups by multiple unique fields

```typescript
const user = await this.prisma.user.findFirst({
  where: { OR: [{ email }, { phone }] },
});
```

---

## Git Practices

- **Branch naming**: `feature/short-description`, `fix/short-description`, `chore/short-description`
- **Commit style**: Use imperative present tense: `Add commission service`, `Fix token rotation bug`
- **Never commit**: `.env` files, `node_modules/`, `dist/`, `coverage/`
- **Always commit**: `prisma/migrations/` — migration files are part of the codebase

---

## Logging

Use NestJS built-in `Logger` (not `console.log`):

```typescript
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
export class MyService {
  private readonly logger = new Logger(MyService.name);

  async doSomething() {
    this.logger.log('Processing started');
    try {
      // ...
    } catch (error) {
      this.logger.error('Processing failed', error.stack);
      throw error;
    }
  }
}
```
