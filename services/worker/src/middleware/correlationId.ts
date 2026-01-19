// Correlation ID Middleware
// Ensures every request has a traceable ID through all layers

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extend Express Request to include correlationId
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

/**
 * Middleware that extracts or generates a correlation ID for every request.
 * The ID is:
 * 1. Extracted from X-Correlation-ID header (if provided by client)
 * 2. Or generated as a new UUID
 * 3. Attached to req.correlationId for use in handlers
 * 4. Added to response headers for client tracing
 */
export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Extract from header or generate new
  const correlationId =
    (req.headers['x-correlation-id'] as string) ||
    (req.headers['x-request-id'] as string) ||
    randomUUID();

  // Attach to request object
  req.correlationId = correlationId;

  // Add to response headers for client tracing
  res.setHeader('X-Correlation-ID', correlationId);

  // Log request start with correlation ID
  console.log(`[${correlationId}] ${req.method} ${req.path} - START`);

  // Log request end on finish
  res.on('finish', () => {
    console.log(`[${correlationId}] ${req.method} ${req.path} - ${res.statusCode}`);
  });

  next();
}

/**
 * Helper to create a logger with correlation ID prefix
 */
export function createLogger(correlationId: string) {
  return {
    info: (message: string, ...args: unknown[]) => {
      console.log(`[${correlationId}] ${message}`, ...args);
    },
    warn: (message: string, ...args: unknown[]) => {
      console.warn(`[${correlationId}] ${message}`, ...args);
    },
    error: (message: string, ...args: unknown[]) => {
      console.error(`[${correlationId}] ${message}`, ...args);
    },
  };
}

/**
 * Standard error response format with correlation ID
 */
export interface ErrorResponse {
  error: string;
  message: string;
  correlationId: string;
  retryable: boolean;
}

/**
 * Helper to send standardized error responses
 */
export function sendErrorResponse(
  res: Response,
  statusCode: number,
  error: string,
  message: string,
  correlationId: string,
  retryable: boolean = false
): void {
  const response: ErrorResponse = {
    error,
    message,
    correlationId,
    retryable,
  };
  res.status(statusCode).json(response);
}
