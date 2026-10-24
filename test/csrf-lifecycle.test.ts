import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { test } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ||= 'file:/tmp/auth-system-csrf-test.db';
process.env.JWT_ACCESS_SECRET ||= 'test-only-access-secret-0123456789abcdef';
process.env.JWT_REFRESH_SECRET ||= 'test-only-refresh-secret-0123456789abcdef';
process.env.CSRF_SECRET ||= 'test-only-csrf-secret-0123456789abcdef';

type CookieJar = Record<string, string>;

const makeResponse = (): { response: Response; cookies: CookieJar } => {
  const cookies: CookieJar = {};
  const response = {
    locals: {},
    cookie(name: string, value: string) {
      cookies[name] = value;
      return response;
    },
  } as unknown as Response;
  return { response, cookies };
};

const makeRequest = (cookies: CookieJar, csrfToken?: string): Request =>
  ({
    method: 'POST',
    ip: '127.0.0.1',
    cookies: { ...cookies },
    headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
  }) as unknown as Request;

const runProtection = async (
  request: Request,
  response: Response,
  csrfProtection: (req: Request, res: Response, next: (err?: unknown) => void) => void,
): Promise<unknown> =>
  new Promise((resolve) => csrfProtection(request, response, (err?: unknown) => resolve(err)));

test('CSRF binding survives authenticated mutations and rotates on login, refresh, and logout', async () => {
  const { csrfProtection, rotateCsrfSession } = await import('../src/middleware/csrf.middleware');

  // Login: the new CSRF binding is issued after the access cookie is established.
  const loginResponse = makeResponse();
  const loginRequest = makeRequest({});
  const loginToken = rotateCsrfSession(loginRequest, loginResponse.response);
  let jar: CookieJar = { ...loginResponse.cookies, access_token: 'access-after-login' };

  // Refresh: validate the old token, then rotate the binding together with the new auth cookies.
  const refreshRequest = makeRequest(jar, loginToken);
  assert.equal(await runProtection(refreshRequest, makeResponse().response, csrfProtection), undefined);
  const refreshResponse = makeResponse();
  const refreshedToken = rotateCsrfSession(refreshRequest, refreshResponse.response);
  jar = { ...jar, ...refreshResponse.cookies, access_token: 'access-after-refresh' };

  // An authenticated mutation remains valid with the refreshed CSRF token.
  const mutationRequest = makeRequest(jar, refreshedToken);
  assert.equal(await runProtection(mutationRequest, makeResponse().response, csrfProtection), undefined);

  // Logout is protected by the current token and then rotates the binding again.
  const logoutRequest = makeRequest(jar, refreshedToken);
  assert.equal(await runProtection(logoutRequest, makeResponse().response, csrfProtection), undefined);
  const logoutResponse = makeResponse();
  rotateCsrfSession(logoutRequest, logoutResponse.response);
  const loggedOutJar = { ...jar, ...logoutResponse.cookies };
  delete loggedOutJar.access_token;

  // A stale pre-logout token must not pass against the rotated cookie pair.
  const staleRequest = makeRequest(loggedOutJar, refreshedToken);
  const staleError = await runProtection(staleRequest, makeResponse().response, csrfProtection);
  assert.ok(staleError instanceof Error);
});
