import { userRepository } from '../repositories/user.repository';
import { refreshTokenRepository } from '../repositories/refresh-token.repository';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  decodeRefreshTokenExpiry,
} from '../utils/jwt';
import { generateRandomToken, sha256 } from '../utils/crypto';
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
   * Rotates a refresh token with reuse detection.
   * If a previously revoked token is reused, ALL tokens for that user are revoked.
   */
  async rotateRefreshToken(
    refreshToken: string,
    metadata: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<TokenPair> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const tokenHash = sha256(refreshToken);
    const stored = await refreshTokenRepository.findByHash(tokenHash);

    if (!stored || stored.userId !== payload.sub) {
      throw new UnauthorizedError('Refresh token not recognized');
    }

    // REUSE DETECTION: a revoked or expired token was presented
    if (stored.revoked || stored.expiresAt < new Date()) {
      logger.warn({ userId: payload.sub }, 'Refresh token reuse detected — revoking all tokens');
      await refreshTokenRepository.revokeAllForUser(payload.sub);
      throw new UnauthorizedError('Refresh token reuse detected. Please log in again.');
    }

    // Rotate: revoke old, issue new
    await refreshTokenRepository.revokeByHash(tokenHash);

    return this.issueTokens(payload.sub, metadata);
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