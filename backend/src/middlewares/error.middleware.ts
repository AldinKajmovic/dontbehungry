import { Request, Response, NextFunction } from 'express';
import { JsonWebTokenError } from 'jsonwebtoken';
import { AppError, UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Only log unexpected errors (not auth errors which are expected during normal operation)
  const isExpectedAuthError = err instanceof UnauthorizedError || err instanceof JsonWebTokenError;
  if (!isExpectedAuthError) {
    logger.error('Request error', err);
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.error,
      details: err.details,
    });
    return;
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json({
      error: 'Invalid token',
      details: 'Token is invalid or expired',
    });
    return;
  }

  res.status(500).json({
    error: 'Internal server error',
    details: 'An unexpected error occurred',
  });
};
