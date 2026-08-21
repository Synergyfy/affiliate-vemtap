import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Build a connection URL for the worker client with its own, smaller pool.
 * The main PrismaService pool (connection_limit from DATABASE_URL) is reserved
 * for user-facing requests; the worker pool serves background/communication
 * work so the automation engine can never starve HTTP traffic of a connection
 * (Prisma P2024 "timed out fetching a new connection").
 */
function buildWorkerUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return url ?? '';
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('connection_limit', '5');
    parsed.searchParams.set('pool_timeout', '20');
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Dedicated Prisma client for the communication engine / cron path.
 * Its connection pool is separate from PrismaService's, so heavy background
 * processing (message dispatch, journey reconciliation, automation rules)
 * cannot exhaust the pool used by user requests.
 */
@Injectable()
export class PrismaWorkerService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const workerUrl = buildWorkerUrl();
    if (workerUrl) {
      super({
        datasources: {
          db: { url: workerUrl },
        },
      });
    } else {
      // Fallback: let Prisma resolve DATABASE_URL from its own env loading.
      super();
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}