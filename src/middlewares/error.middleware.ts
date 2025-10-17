import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger.config';
import { AppError } from '@/utils/errors.util';
import { ResponseBuilder } from '@/utils/response.builder';
import { config } from '@/config/env.config';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Internal Server Error';
  let details: any = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code || 'UNKNOWN_ERROR';
    message = err.message;
    details = err.details;
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

  const response = ResponseBuilder.error(message, code, details);

  if (config.isDevelopment && err.stack) {
    (response.error as any).stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const response = ResponseBuilder.error(
    `Route ${req.method} ${req.originalUrl} not found`,
    'NOT_FOUND'
  );

  res.status(404).json(response);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};