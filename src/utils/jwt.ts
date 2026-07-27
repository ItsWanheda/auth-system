import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtPayload } from '../types/auth.types';
import { UnauthorizedError } from './errors';

export const signAccessToken = (payload: Omit<JwtPayload, 'type'>): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: env.APP_NAME,
    audience: env.APP_NAME,
  };
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, options);
};

export const signRefreshToken = (payload: Omit<JwtPayload, 'type'>): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: env.APP_NAME,
    audience: env.APP_NAME,
  };
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: env.APP_NAME,
      audience: env.APP_NAME,
    }) as JwtPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: env.APP_NAME,
      audience: env.APP_NAME,
    }) as JwtPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
};

export const decodeRefreshTokenExpiry = (token: string): Date => {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (!decoded?.exp) {
    throw new Error('Failed to decode refresh token expiry');
  }
  return new Date(decoded.exp * 1000);
};