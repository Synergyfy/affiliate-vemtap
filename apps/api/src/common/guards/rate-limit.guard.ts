import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import type { Request, Response } from 'express';

/**
 * Sliding-window rate limit for external sync endpoints. Returns 429 with a
 * Retry-After header so Vemtap backs off exponentially instead of hammering.
 * Fails open if Redis is unavailable so the sync pipeline is never blocked.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const limit = Number(
      this.configService.get<string>('EXTERNAL_RATE_LIMIT', '120'),
    );
    const windowSeconds = Number(
      this.configService.get<string>('EXTERNAL_RATE_WINDOW_SECONDS', '60'),
    );

    const rawKey = request.headers['x-api-key'];
    const apiKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;
    const identifier = apiKey || request.ip || 'unknown';
    const key = `rl:external:${identifier}`;

    const redis = this.redisService.getClient();

    let count: number;
    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }
      count = current;
    } catch {
      this.logger.warn('Redis unavailable during rate limiting; allowing request');
      return true;
    }

    response.setHeader('X-RateLimit-Limit', String(limit));
    response.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - count)));

    if (count > limit) {
      const ttl = await redis.ttl(key).catch(() => windowSeconds);
      const retryAfter = Math.max(1, ttl > 0 ? ttl : windowSeconds);
      response.setHeader('Retry-After', String(retryAfter));
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
