import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { buildTunedDatabaseUrl, getMainPoolConfig } from './prisma-url';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Small pool by default (5) so main + worker stay under Supabase
    // session pool_size 15. Use transaction pooler (:6543 + pgbouncer=true)
    // in DATABASE_URL for headroom; explicit URL params always win.
    const { connectionLimit, poolTimeout } = getMainPoolConfig();
    const tuned = buildTunedDatabaseUrl(connectionLimit, poolTimeout);
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