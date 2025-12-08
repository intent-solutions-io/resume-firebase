import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Global error handler middleware
 * Ensures no PII is leaked in error responses
 */
export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error (sanitized - no PII)
  console.error('Error:', {
    name: error.name,
    message: error.message,
    // Don't log stack in production
    ...(process.env.ENVIRONMENT !== 'prod' && { stack: error.stack }),
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Handle known error types
  if (error.name === 'NotFoundError') {
    res.status(404).json({
      error: 'Not Found',
      message: error.message,
    });
    return;
  }

  if (error.name === 'UnauthorizedError') {
    res.status(401).json({
      error: 'Unauthorized',
      message: error.message,
    });
    return;
  }

  if (error.name === 'ForbiddenError') {
    res.status(403).json({
      error: 'Forbidden',
      message: error.message,
    });
    return;
  }

  // Default to 500 for unknown errors
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
}
