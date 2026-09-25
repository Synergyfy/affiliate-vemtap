/**
 * Build a tuned DATABASE_URL for a Prisma client instance.
 *
 * Pool sizing must stay SMALL because Supabase's session-mode pooler
 * (`:5432`) caps total server connections at `pool_size` (15 here, shared
 * across every process). Previously we forced 15 (main) + 5 (worker) = 20
 * connections per Node process, which alone exceeded the server limit and
 * surfaced as EMAXCONNSESSION on bursty endpoints like
 * GET /api/admin/dashboard/stats (15 parallel queries).
 *
 * Rules:
 * - Respect an explicit `connection_limit` / `pool_timeout` already present
 *   in DATABASE_URL (VPS env wins).
 * - Otherwise fall back to the caller-provided defaults (kept small).
 * - Preserve `pgbouncer=true` when present, and auto-add it for the
 *   transaction-mode pooler (`:6543`), which Prisma requires.
 */
function parsePositiveInt(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function getMainPoolConfig(): { connectionLimit: number; poolTimeout: number } {
  return {
    connectionLimit: parsePositiveInt(process.env.PRISMA_CONNECTION_LIMIT, 5),
    poolTimeout: parsePositiveInt(process.env.PRISMA_POOL_TIMEOUT, 30),
  };
}

export function getWorkerPoolConfig(): { connectionLimit: number; poolTimeout: number } {
  return {
    connectionLimit: parsePositiveInt(process.env.PRISMA_WORKER_CONNECTION_LIMIT, 2),
    poolTimeout: parsePositiveInt(process.env.PRISMA_WORKER_POOL_TIMEOUT, 30),
  };
}

export function buildTunedDatabaseUrl(
  connectionLimit: number,
  poolTimeout: number,
): string | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has('connection_limit')) {
      parsed.searchParams.set('connection_limit', String(connectionLimit));
    }
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', String(poolTimeout));
    }
    // Prisma + PgBouncer transaction mode (:6543) requires pgbouncer=true.
    if (parsed.port === '6543' && !parsed.searchParams.has('pgbouncer')) {
      parsed.searchParams.set('pgbouncer', 'true');
    }
    return parsed.toString();
  } catch {
    return null;
  }
}