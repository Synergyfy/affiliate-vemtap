import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/**
 * Maps known Prisma errors to the correct terminal HTTP status codes so that
 * the Vemtap main backend never retries an unrecoverable error (and never gets
 * a misleading 5xx for a data conflict).
 *
 * - P2002 (unique constraint violation) → 409 Conflict (terminal, no retry)
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';

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
      default:
        break;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: ConflictException.name,
    });
  }
}
