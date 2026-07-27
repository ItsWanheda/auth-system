import type { Response } from 'express';
import { env } from '../config/env';

const baseCookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAMESITE,
  domain: env.COOKIE_DOMAIN,
  path: '/',
} as const;

export const setAccessTokenCookie = (res: Response, token: string): void => {
  res.cookie('access_token', token, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
};

export const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie('refresh_token', token, {
    ...baseCookieOptions,
    path: '/auth', // Only sent to /auth endpoints
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

export const setCsrfCookie = (res: Response, token: string): void => {
  res.cookie(env.CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JS for double-submit pattern
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    domain: env.COOKIE_DOMAIN,
    path: '/',
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie('access_token', { ...baseCookieOptions });
  res.clearCookie('refresh_token', { ...baseCookieOptions, path: '/auth' });
};