import { doubleCsrf } from 'csrf-csrf';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { ForbiddenError } from '../utils/errors';

const isProd = env.NODE_ENV === 'production';

const {
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => env.CSRF_SECRET,
  getSessionIdentifier: (req) => (req.cookies?.access_token ?? req.ip ?? 'anon'),
  cookieName: env.CSRF_COOKIE_NAME,
  cookieOptions: {
    httpOnly: false, // double-submit: must be readable by JS
    secure: isProd,
    sameSite: env.COOKIE_SAMESITE === 'none' ? 'none' : 'lax',
    path: '/',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

/** Issues a CSRF token (call from login/signup/refresh). */
export const issueCsrf = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = generateCsrfToken(req, res);
    res.locals.csrfToken = token;
    next();
  } catch (err) {
    next(err);
  }
};

/** Verifies CSRF on protected (state-changing) routes. */
export const csrfProtection = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    doubleCsrfProtection(req, _res, (err?: unknown) => {
      if (err) return next(new ForbiddenError('Invalid or missing CSRF token'));
      next();
    });
  } catch (err) {
    next(new ForbiddenError('CSRF validation failed'));
  }
};