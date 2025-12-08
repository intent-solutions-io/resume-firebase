import rateLimit from 'express-rate-limit';

/**
 * Rate limiter middleware
 * Basic in-memory rate limiting (document limitations for production)
 *
 * Limitations:
 * - In-memory store is not shared across instances
 * - Consider Redis-based store for production multi-instance deployment
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: 15 * 60, // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path.startsWith('/health'),
});

// Stricter limiter for case creation
export const createCaseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 cases per hour per IP
  message: {
    error: 'Too many cases created',
    message: 'Please try again later',
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for upload URL requests
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 upload requests per 15 min per IP
  message: {
    error: 'Too many upload requests',
    message: 'Please try again later',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
