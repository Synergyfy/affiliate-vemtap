# TypeScript Best Practices & Strict Type Standards — Vemtap

This document defines strict TypeScript coding standards across all workspaces (`apps/api` and `apps/web`).

---

## 🚫 1. Absolute Prohibition of `any`

Using `any` disables compiler type checking and leads to unhandled runtime failures.

### Anti-Patterns & Correct Alternatives

```typescript
// ❌ WRONG: Disables all type safety
function processData(input: any): any {
  return input.data.value;
}

// ✅ CORRECT: Use unknown with Type Narrowing
function processData(input: unknown): string {
  if (typeof input === 'object' && input !== null && 'data' in input) {
    const obj = input as { data?: { value?: string } };
    return obj.data?.value ?? '';
  }
  throw new Error('Invalid input shape');
}

// ✅ CORRECT: Use Generics for flexible type contracts
function wrapResponse<T>(data: T): { status: 'success'; data: T } {
  return { status: 'success', data };
}
```

---

## 🎯 2. Explicit Function Return Types

All exported functions, service methods, controller actions, and API wrappers MUST declare explicit return types.

```typescript
// ❌ WRONG: Implicit return type relies on compiler inference
async function getUser(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

// ✅ CORRECT: Explicit return type prevents unintended leaks or drift
async function getUser(id: string): Promise<SafeUser | null> {
  const user = await this.prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  const { password: _, ...safe } = user;
  return safe;
}
```

---

## 🛠️ 3. Leverage Built-in Utility Types

Use standard TypeScript utility types to derive data shapes instead of duplicating interface definitions:

```typescript
// Base Entity (from Prisma)
interface User {
  id: string;
  email: string;
  fullName: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

// 1. Omit: Strips sensitive fields
export type SafeUser = Omit<User, 'password'>;

// 2. Pick: Selects specific fields for minimal payloads
export type UserHeaderSummary = Pick<User, 'id' | 'fullName' | 'email'>;

// 3. Partial: Makes fields optional for update operations
export type UpdateUserProfileInput = Partial<Omit<User, 'id' | 'password' | 'createdAt' | 'updatedAt'>>;

// 4. Readonly: Prevents unexpected state mutations
export type ImmutableConfig = Readonly<{
  apiEndpoint: string;
  maxRetries: number;
}>;
```

---

## 🚦 4. Exhaustive Type Checking with `never`

Ensure all switch statements or conditional branches handling union types (e.g. status enums, user roles) are exhaustive:

```typescript
export enum WithdrawalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
}

function getStatusBadgeColor(status: WithdrawalStatus): string {
  switch (status) {
    case WithdrawalStatus.PENDING:
      return 'yellow';
    case WithdrawalStatus.APPROVED:
      return 'green';
    case WithdrawalStatus.REJECTED:
      return 'red';
    case WithdrawalStatus.PROCESSING:
      return 'blue';
    default: {
      // 🛡️ Compile-time error if a new status enum is added without updating this switch!
      const _exhaustiveCheck: never = status;
      throw new Error(`Unhandled withdrawal status: ${_exhaustiveCheck}`);
    }
  }
}
```

---

## 🛡️ 5. Type Guards & Discriminated Unions

Use discriminated unions for API states or domain events:

```typescript
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function renderState(state: AsyncState<SafeUser[]>) {
  switch (state.status) {
    case 'loading':
      return 'Loading users...';
    case 'error':
      return `Error: ${state.error.message}`;
    case 'success':
      return `Loaded ${state.data.length} users`;
    case 'idle':
      return 'Standby';
  }
}
```

---

## 📋 TypeScript Quality Checklist

- [ ] Does `tsconfig.json` enforce `"strict": true`?
- [ ] Are all functions annotated with explicit return types?
- [ ] Are there zero `any` types added in this pull request?
- [ ] Are non-null assertion operators (`!`) avoided in favor of optional chaining (`?.`) and explicit null checks?
- [ ] Are error objects caught in `try/catch` typed as `unknown` before accessing `.message`?
