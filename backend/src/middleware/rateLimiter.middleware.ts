import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service';
import { TooManyRequestsError } from '../utils/errors';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = 'Too many requests, please try again later.',
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `ratelimit:${keyGenerator(req)}`;
      const windowSeconds = Math.ceil(windowMs / 1000);

      // Get current count
      const current = await cacheService.increment(key, windowSeconds);

      // Set headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - current).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString(),
      });

      if (current > maxRequests) {
        throw new TooManyRequestsError(message);
      }

      // Track response to potentially skip counting
      const originalSend = res.send;
      res.send = function(body) {
        const statusCode = res.statusCode;
        const shouldSkip = 
          (skipSuccessfulRequests && statusCode < 400) ||
          (skipFailedRequests && statusCode >= 400);

        if (shouldSkip) {
          // Decrement counter if we should skip this request
          cacheService.increment(`${key}:decr`, windowSeconds);
        }

        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Predefined rate limiters
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  keyGenerator: (req) => `auth:${req.ip}:${req.body.emailOrUsername || req.body.email}`,
  message: 'Too many authentication attempts, please try again later.',
});

export const messageRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 messages per minute
  keyGenerator: (req) => `message:${req.user?.userId}`,
  message: 'Too many messages sent, please slow down.',
});

export const fileUploadRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 uploads per minute
  keyGenerator: (req) => `upload:${req.user?.userId}`,
  message: 'Too many file uploads, please wait before uploading again.',
});

export const apiRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // 1000 requests per 15 minutes
  keyGenerator: (req) => `api:${req.user?.userId || req.ip}`,
  message: 'API rate limit exceeded, please try again later.',
});

export const searchRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 searches per minute
  keyGenerator: (req) => `search:${req.user?.userId}`,
  message: 'Too many search requests, please wait before searching again.',
});