# Roles & Permissions — Vemtap API

## Role Definitions

The `Role` enum (defined in `schema.prisma`) has three values:

| Role | Description |
|---|---|
| `AFFILIATE` | Default role for all registered users. Can manage their own profile, businesses, commissions, and withdrawal requests. |
| `ADMIN` | Internal staff. Can manage all affiliates, approve/reject withdrawals and commissions, view all data. Cannot modify system configuration. |
| `SUPER_ADMIN` | Full system access. Can manage admins, change system-wide settings, issue manual commissions, and override any business rule. |

---

## Permission Matrix

| Action | AFFILIATE | ADMIN | SUPER_ADMIN |
|---|:---:|:---:|:---:|
| View own profile | ✅ | ✅ | ✅ |
| Update own profile / bank details | ✅ | ❌ | ✅ |
| Submit KYC documents | ✅ | ❌ | ✅ |
| View own referrals | ✅ | ✅ | ✅ |
| View own commissions | ✅ | ✅ | ✅ |
| Request withdrawal | ✅ | ❌ | ✅ |
| View all affiliates | ❌ | ✅ | ✅ |
| Approve/reject commissions | ❌ | ✅ | ✅ |
| Approve/reject withdrawals | ❌ | ✅ | ✅ |
| Manually issue commissions | ❌ | ❌ | ✅ |
| Suspend / deactivate users | ❌ | ✅ | ✅ |
| Create admin accounts | ❌ | ❌ | ✅ |
| Access Prisma Studio (production) | ❌ | ❌ | ✅ |

---

## Implementing Role Guards

Use a custom `RolesGuard` (to be implemented) alongside `@Roles()` decorator:

```typescript
// Apply to a controller method
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Get('admin/affiliates')
getAllAffiliates() { ... }
```

### RolesGuard Pattern (to implement)

```typescript
// src/auth/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

### @Roles Decorator Pattern (to implement)

```typescript
// src/auth/decorators/roles.decorator.ts
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
```

---

## Ownership Enforcement

For routes where an affiliate can only access their own data, always cross-check the resource owner against the authenticated user:

```typescript
@UseGuards(JwtAuthGuard)
@Get('withdrawals/:id')
async getWithdrawal(@Param('id') id: string, @CurrentUser() user: SafeUser) {
  const withdrawal = await this.withdrawalsService.findById(id);
  
  // NEVER skip this check
  if (withdrawal.userId !== user.id && user.role === Role.AFFILIATE) {
    throw new ForbiddenException();
  }
  
  return withdrawal;
}
```

---

## User Status Rules

| Status | Effect |
|---|---|
| `ACTIVE` | Full access |
| `SUSPENDED` | Can login but cannot request withdrawals or add new referrals. Should be enforced at the service layer. |
| `DEACTIVATED` | Login is blocked. `JwtStrategy.validate()` should throw `UnauthorizedException` if `user.status === 'DEACTIVATED'`. |

> **TODO**: Add status checks to `JwtStrategy.validate()` to enforce `SUSPENDED` and `DEACTIVATED` states.

---

## KYC Rules

- Affiliates with `kycStatus: PENDING` **cannot** request withdrawals.
- Affiliates with `kycStatus: REJECTED` must resubmit documents.
- Only `ADMIN` and `SUPER_ADMIN` can change `kycStatus`.
- KYC verification should be checked as a guard or service-level assertion before processing any withdrawal.
