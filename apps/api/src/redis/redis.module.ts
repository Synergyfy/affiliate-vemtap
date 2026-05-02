import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-yet";
import { RedisService } from "./redis.service";

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get<string>("REDIS_HOST");
        if (!redisHost) {
          return { isGlobal: true };
        }
        try {
          return {
            store: await redisStore({
              socket: {
                host: configService.get<string>("REDIS_HOST", "localhost"),
                port: configService.get<number>("REDIS_PORT", 6379),
              },
              password: configService.get<string>("REDIS_PASSWORD"),
              ttl: configService.get<number>("REDIS_TTL", 3600) * 1000,
            }),
          };
        } catch {
          return { isGlobal: true };
        }
      },
    }),
  ],
  providers: [RedisService],
  exports: [RedisService, CacheModule],
})
export class RedisModule {}
