import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { TooManyRequestsError } from '../utils/errors';

const handler = (req: unknown, res: unknown, next: (err?: unknown) => void) => {
  next(new TooManyRequestsError('Too many requests, please slow down'));
};

export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});