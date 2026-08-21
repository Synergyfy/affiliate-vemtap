import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { buildTunedDatabaseUrl } from './prisma-url';

/**
 * Dedicated Prisma client for the communication engine / cron path.
 * Its connection pool is separate from PrismaService's, so heavy background
 * processing (message dispatch, journey reconciliation, automation rules)
 * cannot exhaust the pool used by user requests (Prisma P2024).
 */
@Injectable()
export class PrismaWorkerService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const workerUrl = buildTunedDatabaseUrl(5, 20);
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