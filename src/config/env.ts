import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_NAME: z.string().default('Auth System'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  ARGON2_MEMORY_COST: z.coerce.number().int().positive().default(65536),
  ARGON2_TIME_COST: z.coerce.number().int().positive().default(3),
  ARGON2_PARALLELISM: z.coerce.number().int().positive().default(4),

  COOKIE_DOMAIN: z.string().optional().transform((value) => value?.trim() || undefined),
  COOKIE_SECURE: z.enum(['true', 'false']).transform((value) => value === 'true').default('false'),
  COOKIE_SAMESITE: z.enum(['strict', 'lax', 'none']).default('lax'),

  CSRF_SECRET: z.string().min(32, 'CSRF_SECRET must be at least 32 chars'),
  CSRF_COOKIE_NAME: z.string().default('x-csrf-token'),
  CSRF_HEADER_NAME: z.string().default('x-csrf-token'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  EMAIL_FROM: z.string().email().default('no-reply@example.com'),
  EMAIL_ENABLED: z.enum(['true', 'false']).transform((value) => value === 'true').default('false'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
}).superRefine((values, ctx) => {
  if (values.NODE_ENV !== 'production') return;

  const requireIssue = (path: string, message: string): void => {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
  };
  const isHttps = (value: string): boolean => {
    try {
      return new URL(value).protocol === 'https:';
    } catch {
      return false;
    }
  };

  if (!values.COOKIE_SECURE) {
    requireIssue('COOKIE_SECURE', 'COOKIE_SECURE=true is mandatory in production');
  }
  if (!isHttps(values.APP_URL)) {
    requireIssue('APP_URL', 'APP_URL must use HTTPS in production');
  }
  if (!isHttps(values.FRONTEND_URL)) {
    requireIssue('FRONTEND_URL', 'FRONTEND_URL must use HTTPS in production');
  }
  if (values.COOKIE_DOMAIN && /(^|\.)localhost$/i.test(values.COOKIE_DOMAIN)) {
    requireIssue('COOKIE_DOMAIN', 'COOKIE_DOMAIN must not target localhost in production');
  }
  if (values.COOKIE_SAMESITE === 'none' && !values.COOKIE_SECURE) {
    requireIssue('COOKIE_SAMESITE', 'SameSite=None requires secure cookies');
  }

  const secretFields = [
    ['JWT_ACCESS_SECRET', values.JWT_ACCESS_SECRET],
    ['JWT_REFRESH_SECRET', values.JWT_REFRESH_SECRET],
    ['CSRF_SECRET', values.CSRF_SECRET],
  ] as const;
  const placeholders = /(replace[_ -]?with|please[_ -]?change|change[_ -]?me|your.*secret|example|changeme)/i;
  for (const [field, secret] of secretFields) {
    if (placeholders.test(secret)) {
      requireIssue(field, `${field} must be replaced with a cryptographically random production secret`);
    }
  }
  if (new Set(secretFields.map(([, secret]) => secret)).size !== secretFields.length) {
    requireIssue('CSRF_SECRET', 'JWT and CSRF secrets must all be distinct');
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
