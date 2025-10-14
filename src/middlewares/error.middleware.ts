import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger.config';
import { AppError } from '@/utils/errors.util';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_SERVER_ERROR';
  let details: any = undefined;
  let isOperational = false;

  // Check if error is an AppError instance
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code || 'UNKNOWN_ERROR';
    details = err.details;
    isOperational = err.isOperational;
  } else {
    message = err.message || message;
  }

  const errorLog = {
    statusCode,
    code,
    message,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    ...(details && { details }),
  };

  if (statusCode >= 500) {
    logger.error('Server Error:', { ...errorLog, stack: err.stack });
  } else if (statusCode >= 400) {
    logger.warn('Client Error:', errorLog);
  }

  const response: any = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details && (process.env.NODE_ENV === 'development' || isOperational)) {
    response.error.details = details;
  }

  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
};

//  Async handler wrapper to catch errors in async route handlers
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};