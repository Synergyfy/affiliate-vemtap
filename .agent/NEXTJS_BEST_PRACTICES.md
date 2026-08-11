# Next.js Best Practices & Frontend Standards — Vemtap Web

This document outlines standard architectural rules and UI development guidelines for `apps/web` built with **Next.js (App Router)**, **React 18+**, **TypeScript**, and **Tailwind CSS**.

---

## ⚡ React Server Components (RSC) vs Client Components

Next.js App Router uses Server Components by default. Keep component trees as server-rendered as possible for initial load speed and SEO benefits.

```
       [ App Router Page ] (Server Component) ── Fetches data on server
               │
      ┌────────┴────────┐
      ▼                 ▼
[ Server Card ]    [ Client Modal ] ('use client') ── Interactivity / State / Hooks
```

### 1. When to use Server Components (Default)
- Initial page layouts and static structures.
- Data fetching directly from backend or external services during SSR.
- Security-sensitive code (accessing API keys or server headers).

### 2. When to use Client Components (`'use client'`)
- Using React State or Lifecycle Hooks (`useState`, `useEffect`, `useReducer`, `useContext`).
- Browser Event Listeners (`onClick`, `onChange`, `onSubmit`).
- Custom Hooks (`useAuth`, `useSWR`, `useQuery`).
- Interactive UI widgets (Modals, Dropdowns, Dynamic Forms, Charts).

> 💡 **Rule**: Push `'use client'` as far down the component tree as possible!

---

## 🔄 API Reverse Proxying & Auth Credentials

`apps/web` uses a **proxy layer** (`proxy.ts` / Next.js middleware) to communicate with `apps/api`.

### Key Rules:
1. **HttpOnly Cookie Handling**: Auth tokens (`accessToken`, `refreshToken`) are stored in `httpOnly` cookies set by NestJS API.
2. **Never access tokens in client JS**: Do NOT read auth tokens via `document.cookie` or store them in `localStorage`.
3. **Use credentials in fetch/axios**: Always include `credentials: 'include'` (or `withCredentials: true`) when making requests so cookies pass seamlessly.

```typescript
// lib/api-client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  withCredentials: true, // Send httpOnly cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});
```

---

## 📥 Data Fetching Strategies

Use SWR or React Query for client data fetching, automatic revalidation, and caching.

```typescript
// hooks/use-withdrawals.ts
'use client';

import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export function useWithdrawals() {
  const { data, error, isLoading, mutate } = useSWR('/withdrawals', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  return {
    withdrawals: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
```

---

## 🎭 UX & UI Standards: Suspense & Loading Skeletons

Every route and dynamic card MUST handle 3 states: **Loading**, **Error**, and **Empty State**.

```tsx
// app/(dashboard)/affiliate/page.tsx
import { Suspense } from 'react';
import { StatSkeleton } from '@/components/ui/stat-skeleton';
import { EarningsOverview } from '@/components/dashboard/earnings-overview';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Affiliate Dashboard</h1>
      <Suspense fallback={<StatSkeleton count={4} />}>
        <EarningsOverview />
      </Suspense>
    </div>
  );
}
```

---

## 🎨 Theme & Styling Guidelines

1. **Use Tailwind Tokens**: Avoid arbitrary inline pixel styles (`style={{ width: '235px' }}`). Use standard Tailwind spacing and design system tokens.
2. **Accessible Contrast**: Ensure text contrast meets WCAG AA standards (`text-slate-900` on white, `text-slate-100` on dark backgrounds).
3. **Responsive Design**: Always build mobile-first (`flex flex-col md:flex-row`).

---

## 🛑 Common Frontend Anti-Patterns to Avoid

- ❌ **Storing user tokens in `localStorage`**: Vulnerable to XSS attacks!
- ❌ **Creating huge monolith page files**: Split pages into reusable components under `components/`.
- ❌ **Using `any` for API responses**: Define explicit TypeScript interfaces for all backend response payloads in `types/`.
- ❌ **Missing unique keys in list renders**: Always provide `key={item.id}` when mapping over arrays.
