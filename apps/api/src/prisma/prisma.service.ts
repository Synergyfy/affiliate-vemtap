import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { buildTunedDatabaseUrl } from './prisma-url';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Force a healthy pool for user-facing requests regardless of the exact
    // DATABASE_URL string deployed in each environment (see prisma-url.ts).
    const tuned = buildTunedDatabaseUrl(15, 20);
    if (tuned) {
      super({ datasources: { db: { url: tuned } } });
    } else {
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