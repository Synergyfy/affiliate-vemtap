import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import { ObservabilityStoreService } from './observability.store';
import { LogEntryDto } from './dto/observability.dto';

const EXCLUDED_PATHS = ['/api/v1/observability', '/api/health', '/api/metrics'];

interface AuthenticatedRequest extends Request {
  traceId?: string;
  user?: { id: string; email: string; role: string };
}

@Injectable()
export class ObservabilityLoggingInterceptor implements NestInterceptor {
  constructor(private readonly store: ObservabilityStoreService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    const path = request.route?.path || request.path || request.url;
    if (EXCLUDED_PATHS.some((p) => path.startsWith(p))) {
      return next.handle();
    }

    const start = Date.now();
    const requestId = request.headers['x-request-id'];
    const traceId = request.traceId ??
      (Array.isArray(requestId) ? requestId[0] : requestId) ??
      randomUUID();
    const method = request.method;
    const url = request.originalUrl || request.url;
    const headers = request.headers;
    const query = request.query;
    const body = request.body;
    const user = request.user;

    return next.handle().pipe(
      tap((responseBody) => {
        const responseTime = Date.now() - start;
        const statusCode = response.statusCode;

        const entry: LogEntryDto = {
          id: randomUUID(),
          timestamp: new Date().toISOString(),
          method,
          url,
          statusCode,
          responseTime,
          headers: this.sanitizeHeaders(headers),
          query:
            Object.keys(query || {}).length > 0 ? query : undefined,
          body:
            body && typeof body === 'object' && Object.keys(body).length > 0
              ? this.truncate(body)
              : undefined,
          responseBody:
            responseBody && typeof responseBody === 'object'
              ? this.truncate(responseBody)
              : undefined,
          user: user
            ? { id: user.id, email: user.email, role: user.role }
            : undefined,
          traceId,
        };

        this.store.addLog(entry);
      }),
      catchError((err: unknown) => {
        const responseTime = Date.now() - start;
        const error = this.getErrorDetails(err);

        const entry: LogEntryDto = {
          id: randomUUID(),
          timestamp: new Date().toISOString(),
          method,
          url,
          statusCode: error.statusCode,
          responseTime,
          headers: this.sanitizeHeaders(headers),
          query:
            Object.keys(query || {}).length > 0 ? query : undefined,
          body:
            body && typeof body === 'object' && Object.keys(body).length > 0
              ? this.truncate(body)
              : undefined,
          user: user
            ? { id: user.id, email: user.email, role: user.role }
            : undefined,
          traceId,
          error: {
            message: error.message,
            name: error.name,
            stack:
              process.env.NODE_ENV !== 'production'
                ? error.stack
                : undefined,
          },
        };

        this.store.addLog(entry);
        return throwError(() => err);
      }),
    );
  }

  private sanitizeHeaders(
    headers: Record<string, string | string[] | undefined>,
  ): Record<string, string | string[]> {
    const sanitized: Record<string, string | string[]> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined) sanitized[key] = value;
    }
    const sensitive = [
      'authorization',
      'cookie',
      'set-cookie',
      'x-api-key',
      'x-vemtap-secret',
    ];
    for (const key of sensitive) {
      if (sanitized[key]) sanitized[key] = '[REDACTED]';
    }
    return sanitized;
  }

  private truncate(obj: unknown): unknown {
    if (typeof obj !== 'object' || obj === null) return obj;
    try {
      const str = JSON.stringify(obj);
      if (str.length > 1000) {
        if (Array.isArray(obj)) {
          const truncatedArray: unknown[] = [];
          let currentLength = 2; // "[]"
          for (const item of obj) {
            const itemStr = JSON.stringify(item) ?? 'null';
            if (currentLength + itemStr.length + 1 > 800) {
              break;
            }
            truncatedArray.push(item);
            currentLength += itemStr.length + 1;
          }
          truncatedArray.push({
            _info: `Truncated ${obj.length - truncatedArray.length} items due to size limit`,
            _originalLength: obj.length,
          });
          return truncatedArray;
        }

        const truncatedObj: Record<string, unknown> = {};
        let currentLength = 2; // "{}"
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
          const valStr = JSON.stringify({ [key]: value }) ?? 'null';
          if (currentLength + valStr.length > 800) {
            break;
          }
          truncatedObj[key] = value;
          currentLength += valStr.length;
        }

        truncatedObj._info = 'Body truncated due to size constraints';
        truncatedObj._originalLength = str.length;
        return truncatedObj;
      }
    } catch (err) {
      return {
        _error: 'Failed to serialize or truncate body',
        message: err instanceof Error ? err.message : String(err),
      };
    }
    return obj;
  }

  private getErrorDetails(error: unknown): {
    statusCode: number;
    message: string;
    name: string;
    stack?: string;
  } {
    if (error instanceof Error) {
      const statusCode = this.getStatusCode(error);
      return {
        statusCode,
        message: error.message || 'Internal server error',
        name: error.name || 'Error',
        stack: error.stack,
      };
    }

    const details = typeof error === 'object' && error !== null
      ? error as { status?: unknown; statusCode?: unknown; message?: unknown; name?: unknown; stack?: unknown }
      : {};

    return {
      statusCode: this.getStatusCode(details),
      message: typeof details.message === 'string' ? details.message : 'Internal server error',
      name: typeof details.name === 'string' ? details.name : 'Error',
      stack: typeof details.stack === 'string' ? details.stack : undefined,
    };
  }

  private getStatusCode(error: unknown): number {
    if (typeof error !== 'object' || error === null) return 500;

    const details = error as { status?: unknown; statusCode?: unknown };
    if (typeof details.status === 'number') return details.status;
    if (typeof details.statusCode === 'number') return details.statusCode;
    return 500;
  }
}
