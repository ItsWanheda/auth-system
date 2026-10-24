import { userRepository } from '../repositories/user.repository';
import { refreshTokenRepository } from '../repositories/refresh-token.repository';
import { prisma } from '../prisma/prisma.client';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  decodeRefreshTokenExpiry,
} from '../utils/jwt';
import { sha256 } from '../utils/crypto';
import { UnauthorizedError } from '../utils/errors';
import type { TokenPair } from '../types/auth.types';
import { logger } from '../config/logger';

export class TokenService {
  /**
   * Issues a fresh access + refresh token pair and persists the refresh token hash.
   * Implements Refresh Token Rotation: every issued refresh token is a new one.
   */
  async issueTokens(
    userId: string,
    metadata: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<TokenPair> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      username: user.username,
    });

    const refreshToken = signRefreshToken({
      sub: user.id,
      email: user.email,
      username: user.username,
    });

    const tokenHash = sha256(refreshToken);
    const expiresAt = decodeRefreshTokenExpiry(refreshToken);

    await refreshTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Atomically claims the old refresh token and creates its replacement.
   * Exactly one concurrent request can claim an active token.
   */
  async rotateRefreshToken(
    refreshToken: string,
    metadata: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<TokenPair> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const tokenHash = sha256(refreshToken);
    const now = new Date();

    const rotateInTransaction = () =>
      prisma.$transaction(async (tx) => {
        const claimed = await tx.refreshToken.updateMany({
          where: {
            tokenHash,
            userId: payload.sub,
            revoked: false,
            expiresAt: { gt: now },
          },
          data: { revoked: true },
        });

        if (claimed.count !== 1) return null;

        const user = await tx.user.findUnique({ where: { id: payload.sub } });
        if (!user) throw new UnauthorizedError('User no longer exists');

        const nextAccessToken = signAccessToken({
          sub: user.id,
          email: user.email,
          username: user.username,
        });
        const nextRefreshToken = signRefreshToken({
          sub: user.id,
          email: user.email,
          username: user.username,
        });

        await tx.refreshToken.create({
          data: {
            userId: user.id,
            tokenHash: sha256(nextRefreshToken),
            expiresAt: decodeRefreshTokenExpiry(nextRefreshToken),
            userAgent: metadata.userAgent,
            ipAddress: metadata.ipAddress,
          },
        });

        return { accessToken: nextAccessToken, refreshToken: nextRefreshToken };
      });

    // SQLite may reject a competing writer with SQLITE_BUSY rather than returning
    // count=0. Retry only transient lock/write-conflict errors; each retry starts
    // a fresh transaction and re-evaluates the revoked=false claim condition.
    const isTransientWriteConflict = (error: unknown): boolean => {
      const message = error instanceof Error ? error.message : String(error);
      const code =
        typeof error === 'object' && error !== null && 'code' in error &&
        typeof error.code === 'string'
          ? error.code
          : undefined;

      return (
        code === 'P2034' ||
        code === 'P1008' ||
        /SQLITE_BUSY|database is locked|write conflict|deadlock/i.test(message)
      );
    };

    let rotated: TokenPair | null = null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        rotated = await rotateInTransaction();
        break;
      } catch (error) {
        if (attempt === 3 || !isTransientWriteConflict(error)) throw error;
        await new Promise<void>((resolve) => setTimeout(resolve, 25 * 2 ** attempt));
      }
    }

    if (rotated) return rotated;

    // Preserve replay detection when an already-revoked/expired token is presented.
    const stored = await refreshTokenRepository.findByHash(tokenHash);
    if (!stored || stored.userId !== payload.sub) {
      throw new UnauthorizedError('Refresh token not recognized');
    }

    if (stored.revoked || stored.expiresAt <= new Date()) {
      logger.warn({ userId: payload.sub }, 'Refresh token reuse detected — revoking all tokens');
      await refreshTokenRepository.revokeAllForUser(payload.sub);
      throw new UnauthorizedError('Refresh token reuse detected. Please log in again.');
    }

    throw new UnauthorizedError('Refresh token could not be rotated');
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = sha256(refreshToken);
    const stored = await refreshTokenRepository.findByHash(tokenHash);
    if (stored && !stored.revoked) {
      await refreshTokenRepository.revokeByHash(tokenHash);
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await refreshTokenRepository.revokeAllForUser(userId);
  }
}

export const tokenService = new TokenService();
