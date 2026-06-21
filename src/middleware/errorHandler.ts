import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { logger } from '../lib/logger';
import { env } from '../config/env';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(422).json(
      ApiResponse.fail('Validation failed', err.errors as never),
    );
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json(
      ApiResponse.fail(err.message),
    );
    return;
  }

  if (err instanceof TokenExpiredError) {
    res.status(401).json(ApiResponse.fail('Token expired'));
    return;
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json(ApiResponse.fail('Invalid token'));
    return;
  }

  // Unknown / unexpected error
  logger.error({ err }, 'Unhandled error');
  const message = env.isProd ? 'Internal server error' : (err as Error).message;
  res.status(500).json(ApiResponse.fail(message));
}
