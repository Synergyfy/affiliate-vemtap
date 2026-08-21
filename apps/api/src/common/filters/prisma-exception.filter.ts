import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/**
 * Maps known Prisma errors to the correct terminal HTTP status codes so that
 * the Vemtap main backend never retries an unrecoverable error (and never gets
 * a misleading 5xx for a data conflict).
 *
 * - P2002 (unique constraint violation) → 409 Conflict (terminal, no retry)
 * - P2003 (foreign key violation) → 400 Bad Request
 * - P2025 (record not found) → 404 Not Found
 * - P2024 (connection pool timeout) → 503 Service Unavailable (retryable)
 * - P2034 (transaction write conflict / deadlock) → 409 Conflict (retryable)
 * - P2021/P2022 (missing table/column) → 500 (deployment/schema mismatch)
 *
 * The REAL error code + message are logged server-side. Previously the actual
 * Prisma error was silently discarded and every failure was mislabeled
 * `error: "ConflictException"` — making incidents like the Neon connection-pool
 * exhaustion (P2024) impossible to diagnose from the API response alone.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';
    let retryable = false;

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = 'A record with this value already exists';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Related record not found';
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;
      case 'P2024':
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Database connection pool is busy, please retry';
        retryable = true;
        break;
      case 'P2034':
        status = HttpStatus.CONFLICT;
        message = 'Transaction conflict, please retry';
        retryable = true;
        break;
      case 'P2021':
        message = 'Database table is missing (migrations not applied)';
        break;
      case 'P2022':
        message = 'Database column is missing (migrations not applied)';
        break;
      default:
        break;
    }

    this.logger.error(
      `Prisma error code=${exception.code} status=${status} message=${exception.message}`,
      exception.stack,
    );

    response.status(status).json({
      statusCode: status,
      message,
      error: exception.name,
      ...(retryable ? { retryable: true } : {}),
    });
  }
}