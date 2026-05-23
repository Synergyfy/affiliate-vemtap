import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const existingId = req.headers['x-request-id'];
    const traceId = existingId || randomUUID();
    req.headers['x-request-id'] = traceId as string;
    (req as any).traceId = traceId;
    next();
  }
}
