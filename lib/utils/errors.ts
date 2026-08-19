/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Daytona API error
 */
export class DaytonaError extends APIError {
  constructor(message: string, code?: string) {
    super(500, message, code);
    this.name = 'DaytonaError';
  }
}

/**
 * AI service error
 */
export class AIError extends APIError {
  constructor(message: string, code?: string) {
    super(500, message, code);
    this.name = 'AIError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends APIError {
  constructor(
    message: string,
    public field?: string
  ) {
    super(400, message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends APIError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends APIError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/**
 * Handle errors and return formatted response
 */
export function handleError(error: unknown) {
  if (error instanceof APIError) {
    return {
      statusCode: error.statusCode,
      error: error.message,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    console.error('[Error]', error.message, error.stack);
    return {
      statusCode: 500,
      error: error.message,
      code: 'INTERNAL_ERROR',
    };
  }

  console.error('[Unknown Error]', error);
  return {
    statusCode: 500,
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  };
}

/**
 * Safe error response for API routes
 */
export function errorResponse(
  error: unknown,
  defaultStatusCode: number = 500
) {
  const handled = handleError(error);
  return {
    statusCode: handled.statusCode || defaultStatusCode,
    body: {
      success: false,
      error: handled.error,
      code: handled.code,
    },
  };
}
