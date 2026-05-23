import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Counter, Histogram, Registry } from 'prom-client';

const registry = new Registry();

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [registry],
});

const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5, 10],
  registers: [registry],
});

const httpErrorsTotal = new Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status'],
  registers: [registry],
});

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const { method, path } = req;
    const end = httpRequestDurationSeconds.startTimer({ method, route: path });

    res.on('finish', () => {
      const { statusCode } = res;
      end({ method, route: path });
      httpRequestsTotal.inc({ method, route: path, status: String(statusCode) });
      if (statusCode >= 400) {
        httpErrorsTotal.inc({ method, route: path, status: String(statusCode) });
      }
    });

    next();
  }
}

export function getMetricsContentType(): string {
  return registry.contentType;
}

export async function getMetrics(): Promise<string> {
  return registry.metrics();
}
