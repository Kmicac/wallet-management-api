// Base Application Error

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this);
  }
}

// 400 - Bad Request
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', details?: any) {
    super(message, 400, true, 'BAD_REQUEST', details);
  }
}

// 401 - Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(message, 401, true, 'UNAUTHORIZED', details);
  }
}

//   403 - Forbidden
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(message, 403, true, 'FORBIDDEN', details);
  }
}


//   404 - Not Found
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 404, true, 'NOT_FOUND', details);
  }
}

// 409 - Conflict
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', details?: any) {
    super(message, 409, true, 'CONFLICT', details);
  }
}

// 422 - Unprocessable Entity
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 422, true, 'VALIDATION_ERROR', details);
  }
}

// 429 - Too Many Requests
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', details?: any) {
    super(message, 429, true, 'RATE_LIMIT_EXCEEDED', details);
  }
}

// 500 - Internal Server Error
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, 500, false, 'INTERNAL_SERVER_ERROR', details);
  }
}

// 503 - Service Unavailable
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service unavailable', details?: any) {
    super(message, 503, false, 'SERVICE_UNAVAILABLE', details);
  }
}

// Database Error
export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', details?: any) {
    super(message, 500, false, 'DATABASE_ERROR', details);
  }
}


//  Blockchain Validation Error
export class BlockchainValidationError extends AppError {
  constructor(message: string = 'Invalid blockchain address', details?: any) {
    super(message, 422, true, 'BLOCKCHAIN_VALIDATION_ERROR', details);
  }
}