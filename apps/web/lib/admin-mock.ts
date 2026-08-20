'use client';

/** Build-time flag (inlined by Next.js from .env.local). */
function envMockEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_ADMIN_MOCK?.trim().toLowerCase();
  return raw === 'true' || raw === '1';
}

/** Runtime fallback via <meta name="admin-mock"> from root layout. */
function metaMockEnabled(): boolean {
  if (typeof document === 'undefined') return false;
  return document.querySelector('meta[name="admin-mock"]')?.getAttribute('content') === 'true';
}

/**
 * When true, auth and admin API hooks bypass the backend entirely.
 * Set NEXT_PUBLIC_ADMIN_MOCK=true in apps/web/.env.local and restart the dev server.
 */
export function isAdminMockEnabled(): boolean {
  return envMockEnabled() || metaMockEnabled();
}

/** @deprecated Use isAdminMockEnabled() — kept for modules that expect a constant. */
export const IS_ADMIN_MOCK = envMockEnabled();
