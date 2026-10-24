import { randomBytes } from 'node:crypto';
import { doubleCsrf } from 'csrf-csrf';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { ForbiddenError } from '../utils/errors';

const CSRF_SESSION_COOKIE = 'csrf_session_id';

const csrfSessionCookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAMESITE,
  domain: env.COOKIE_DOMAIN,
  path: '/',
} as const;

const {
  generateToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => env.CSRF_SECRET,
  // This identifier is independent of the access JWT, which changes on login/refresh.
  getSessionIdentifier: (req) => {
    const identifier = req.cookies?.[CSRF_SESSION_COOKIE];
    return typeof identifier === 'string' ? identifier : 'missing-csrf-session';
  },
  cookieName: env.CSRF_COOKIE_NAME,
  cookieOptions: {
    httpOnly: false,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    domain: env.COOKIE_DOMAIN,
    path: '/',
  },
  getTokenFromRequest: (req) => {
    const header = req.headers[env.CSRF_HEADER_NAME.toLowerCase()];
    return Array.isArray(header) ? header[0] : header;
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

const setSessionIdentifier = (req: Request, res: Response, identifier: string): void => {
  req.cookies = { ...(req.cookies ?? {}), [CSRF_SESSION_COOKIE]: identifier };
  res.cookie(CSRF_SESSION_COOKIE, identifier, csrfSessionCookieOptions);
};

/**
 * Rotates the CSRF session binding and issues a token for the new binding.
 * Call after login, refresh, logout, or another authentication-state transition.
 */
export const rotateCsrfSession = (req: Request, res: Response): string => {
  const identifier = randomBytes(32).toString('hex');
  setSessionIdentifier(req, res, identifier);
  const token = generateToken(req, res, true);
  res.locals.csrfToken = token;
  return token;
};

/** Issues a CSRF token without rotating an existing authenticated session. */
export const issueCsrf = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const existing = req.cookies?.[CSRF_SESSION_COOKIE];
    if (typeof existing !== 'string' || !/^[a-f0-9]{64}$/i.test(existing)) {
      setSessionIdentifier(req, res, randomBytes(32).toString('hex'));
    }

    const token = generateToken(req, res);
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
  } catch {
    next(new ForbiddenError('CSRF validation failed'));
  }
};
