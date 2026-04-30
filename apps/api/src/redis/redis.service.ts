import { Injectable, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);
  private isConnected = false;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>("REDIS_HOST", "localhost");
    const port = this.configService.get<number>("REDIS_PORT", 6379);
    const password = this.configService.get<string>("REDIS_PASSWORD");

    this.client = new Redis({
      host,
      port,
      password,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    this.client.on("connect", () => {
      this.isConnected = true;
      this.logger.log(`Successfully connected to Redis at ${host}:${port}`);
    });

    this.client.on("error", (err) => {
      if (!this.isConnected) {
        this.logger.warn(
          `Redis not available: ${err.message}. Running without cache.`,
        );
      }
    });

    this.client.connect().catch(() => {
      this.logger.warn(`Redis connection failed. Running without cache.`);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<"OK"> {
    if (ttl) {
      return this.client.set(key, value, "EX", ttl);
    }
    return this.client.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async flushall(): Promise<"OK"> {
    return this.client.flushall();
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
