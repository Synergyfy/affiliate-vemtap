/**
 * Build a tuned DATABASE_URL for a Prisma client instance.
 *
 * Prisma's default pool is `num_cpus * 2 + 1` connections (3 on a 1-vCPU
 * machine) with a 10s wait timeout. That is far too small once background
 * automation (the communication engine) shares or neighbors the pool, and
 * manifests as P2024 "Timed out fetching a new connection" even for simple
 * queries (e.g. user.findUnique during auth).
 *
 * We force explicit pool settings in CODE so the deployed pool size never
 * silently depends on the exact DATABASE_URL string in each environment.
 */
export function buildTunedDatabaseUrl(
  connectionLimit: number,
  poolTimeout: number,
): string | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('connection_limit', String(connectionLimit));
    parsed.searchParams.set('pool_timeout', String(poolTimeout));
    return parsed.toString();
  } catch {
    return null;
  }
}