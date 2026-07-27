import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';
import { env } from '../config/env';

interface ErrorResponseBody {
  success: false;
  message: string;
  code: string;
  details?: unknown;
  stack?: string;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong';
  let details: unknown;

  // Our custom errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    const extra = (err as Error & { details?: unknown }).details;
    if (extra !== undefined) details = extra;
  }
  // Prisma known errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      code = 'CONFLICT';
      message = 'A record with these unique fields already exists';
    } else if (err.code === 'P2025') {
      statusCode = 404;
      code = 'NOT_FOUND';
      message = 'Resource not found';
    } else {
      statusCode = 400;
      code = `PRISMA_${err.code}`;
      message = 'Database operation failed';
    }
  }
  // Prisma validation errors
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    code = 'PRISMA_VALIDATION';
    message = 'Invalid data provided';
  }
  // Zod errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.issues;
  }

  const logPayload = {
    err: { message: err.message, name: err.name, stack: err.stack },
    path: req.path,
    method: req.method,
    ip: req.ip,
  };
  if (statusCode >= 500) {
    logger.error(logPayload, 'Request error');
  } else {
    logger.warn(logPayload, 'Request error');
  }

  const body: ErrorResponseBody = {
    success: false,
    message,
    code,
    ...(details !== undefined && { details }),
    ...(env.NODE_ENV !== 'production' && statusCode >= 500 && { stack: err.stack }),
  };

  res.status(statusCode).json(body);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND',
  });
};