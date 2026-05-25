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
import { ObservabilityStoreService } from './observability.store';
import { LogEntryDto } from './dto/observability.dto';

const EXCLUDED_PATHS = ['/api/v1/observability', '/api/health', '/api/metrics'];

@Injectable()
export class ObservabilityLoggingInterceptor implements NestInterceptor {
  constructor(private readonly store: ObservabilityStoreService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const path = request.route?.path || request.path || request.url;
    if (EXCLUDED_PATHS.some((p) => path.startsWith(p))) {
      return next.handle();
    }

    const start = Date.now();
    const traceId =
      (request as any).traceId ||
      request.headers['x-request-id'] ||
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
      catchError((err) => {
        const responseTime = Date.now() - start;
        const statusCode = err.status || err.statusCode || 500;

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
          user: user
            ? { id: user.id, email: user.email, role: user.role }
            : undefined,
          traceId,
          error: {
            message: err.message || 'Internal server error',
            name: err.name || 'Error',
            stack:
              process.env.NODE_ENV !== 'production'
                ? err.stack
                : undefined,
          },
        };

        this.store.addLog(entry);
        return throwError(() => err);
      }),
    );
  }

  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sanitized = { ...headers };
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

  private truncate(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    try {
      const str = JSON.stringify(obj);
      if (str.length > 1000) {
        if (Array.isArray(obj)) {
          const truncatedArray: any[] = [];
          let currentLength = 2; // "[]"
          for (const item of obj) {
            const itemStr = JSON.stringify(item);
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

        const truncatedObj: Record<string, any> = {};
        let currentLength = 2; // "{}"
        for (const [key, value] of Object.entries(obj)) {
          const valStr = JSON.stringify({ [key]: value });
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
}
