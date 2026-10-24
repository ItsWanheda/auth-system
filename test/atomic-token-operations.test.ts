import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';

// Set required configuration before importing modules that validate environment variables.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ||= 'file:/tmp/auth-system-test.db';
process.env.JWT_ACCESS_SECRET ||= 'test-only-access-secret-0123456789abcdef';
process.env.JWT_REFRESH_SECRET ||= 'test-only-refresh-secret-0123456789abcdef';
process.env.CSRF_SECRET ||= 'test-only-csrf-secret-0123456789abcdef';

test('refresh, password-reset, and verification tokens are single-use under concurrency', async (t) => {
  const [{ prisma }, { TokenService }, { AuthService }, { sha256 }] = await Promise.all([
    import('../src/prisma/prisma.client'),
    import('../src/services/token.service'),
    import('../src/auth/auth.service'),
    import('../src/utils/crypto'),
  ]);

  let userId: string | undefined;
  t.after(async () => {
    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  const id = randomUUID();
  const user = await prisma.user.create({
    data: {
      username: `atomic-${id}`,
      email: `atomic-${id}@example.com`,
      passwordHash: 'unused-test-password-hash',
    },
  });
  userId = user.id;

  const tokenService = new TokenService();
  const authService = new AuthService();

  await t.test('only one concurrent refresh request can claim a token', async () => {
    const issued = await tokenService.issueTokens(user.id, { userAgent: 'atomic-test' });
    const outcomes = await Promise.allSettled([
      tokenService.rotateRefreshToken(issued.refreshToken),
      tokenService.rotateRefreshToken(issued.refreshToken),
    ]);

    assert.equal(outcomes.filter((result) => result.status === 'fulfilled').length, 1);
    const persisted = await prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(issued.refreshToken) },
    });
    assert.equal(persisted?.revoked, true);
  });

  await t.test('a password-reset token can update the password only once', async () => {
    const rawToken = `reset-${randomUUID()}`;
    const tokenHash = sha256(rawToken);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const outcomes = await Promise.allSettled([
      authService.resetPassword(
        { token: rawToken, newPassword: 'A-Strong-Test-Password-123!' },
        { ip: '127.0.0.1', userAgent: 'atomic-test' },
      ),
      authService.resetPassword(
        { token: rawToken, newPassword: 'A-Strong-Test-Password-123!' },
        { ip: '127.0.0.1', userAgent: 'atomic-test' },
      ),
    ]);

    assert.equal(outcomes.filter((result) => result.status === 'fulfilled').length, 1);
    const persisted = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    assert.equal(persisted?.used, true);
  });

  await t.test('an email-verification token can be consumed only once', async () => {
    const rawToken = `verify-${randomUUID()}`;
    const tokenHash = sha256(rawToken);
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const outcomes = await Promise.allSettled([
      authService.verifyEmail(rawToken, { ip: '127.0.0.1', userAgent: 'atomic-test' }),
      authService.verifyEmail(rawToken, { ip: '127.0.0.1', userAgent: 'atomic-test' }),
    ]);

    assert.equal(outcomes.filter((result) => result.status === 'fulfilled').length, 1);
    const persisted = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
    assert.equal(persisted?.used, true);
    const verifiedUser = await prisma.user.findUnique({ where: { id: user.id } });
    assert.equal(verifiedUser?.isVerified, true);
  });
});
