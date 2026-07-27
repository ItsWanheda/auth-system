import { userRepository } from '../repositories/user.repository';
import { refreshTokenRepository } from '../repositories/refresh-token.repository';
import { passwordResetTokenRepository } from '../repositories/password-reset-token.repository';
import { emailVerificationTokenRepository } from '../repositories/email-verification-token.repository';
import { tokenService } from '../services/token.service';
import { emailService } from '../services/email.service';
import { auditService } from '../services/audit.service';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateRandomToken, sha256 } from '../utils/crypto';
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } from '../utils/errors';
import type {
  SignupInput,
  LoginInput,
  ChangePasswordInput,
  ResetPasswordInput,
} from '../validators/auth.validator';
import type { TokenPair } from '../types/auth.types';

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

export class AuthService {
  async signup(input: SignupInput, metadata: { ip?: string; userAgent?: string }): Promise<{
    userId: string;
  }> {
    if (await userRepository.existsByEmail(input.email)) {
      throw new ConflictError('Email already registered');
    }
    if (await userRepository.existsByUsername(input.username)) {
      throw new ConflictError('Username already taken');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      username: input.username,
      email: input.email,
      passwordHash,
    });

    // Issue email verification token
    const verifyToken = generateRandomToken();
    await emailVerificationTokenRepository.create({
      userId: user.id,
      tokenHash: sha256(verifyToken),
      expiresAt: new Date(Date.now() + ONE_DAY),
    });
    await emailService.sendVerificationEmail(user.email, verifyToken);

    await auditService.log('USER_SIGNUP', { userId: user.id, ...metadata });

    return { userId: user.id };
  }

  async login(
    input: LoginInput,
    metadata: { ip?: string; userAgent?: string },
  ): Promise<TokenPair> {
    const identifier = input.email ?? input.username!;
    const user = await userRepository.findByEmailOrUsername(identifier);

    if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
      await auditService.log('USER_LOGIN_FAILED', {
        metadata: { identifier },
        ...metadata,
      });
      throw new UnauthorizedError('Invalid credentials');
    }

    const tokens = await tokenService.issueTokens(user.id, {
      userAgent: metadata.userAgent,
      ipAddress: metadata.ip,
    });

    await auditService.log('USER_LOGIN_SUCCESS', { userId: user.id, ...metadata });

    return tokens;
  }

  async logout(refreshToken: string | undefined, userId: string, metadata: { ip?: string; userAgent?: string }): Promise<void> {
    if (refreshToken) {
      await tokenService.revokeRefreshToken(refreshToken);
    }
    await auditService.log('USER_LOGOUT', { userId, ...metadata });
  }

  async refresh(
    refreshToken: string,
    metadata: { ip?: string; userAgent?: string },
  ): Promise<TokenPair> {
    try {
      const tokens = await tokenService.rotateRefreshToken(refreshToken, {
        userAgent: metadata.userAgent,
        ipAddress: metadata.ip,
      });
      await auditService.log('TOKEN_REFRESH', { userId: tokens ? undefined : undefined, ...metadata });
      return tokens;
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        await auditService.log('TOKEN_REFRESH_REUSE_DETECTED', metadata);
      }
      throw err;
    }
  }

  async forgotPassword(email: string, metadata: { ip?: string; userAgent?: string }): Promise<void> {
    const user = await userRepository.findByEmail(email);
    // Don't reveal whether the email exists
    if (!user) {
      await auditService.log('PASSWORD_RESET_REQUEST', {
        metadata: { email, status: 'unknown_email' },
        ...metadata,
      });
      return;
    }

    // Invalidate any existing reset tokens
    await passwordResetTokenRepository.invalidateAllForUser(user.id);

    const token = generateRandomToken();
    await passwordResetTokenRepository.create({
      userId: user.id,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + ONE_HOUR),
    });

    await emailService.sendPasswordResetEmail(user.email, token);

    await auditService.log('PASSWORD_RESET_REQUEST', { userId: user.id, ...metadata });
  }

  async resetPassword(
    input: ResetPasswordInput,
    metadata: { ip?: string; userAgent?: string },
  ): Promise<void> {
    const tokenHash = sha256(input.token);
    const stored = await passwordResetTokenRepository.findByHash(tokenHash);

    if (!stored || stored.used || stored.expiresAt < new Date()) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const user = await userRepository.findById(stored.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const passwordHash = await hashPassword(input.newPassword);
    await userRepository.updatePassword(user.id, passwordHash);
    await passwordResetTokenRepository.markUsed(stored.id);

    // Revoke all refresh tokens for security
    await refreshTokenRepository.revokeAllForUser(user.id);

    await auditService.log('PASSWORD_RESET_SUCCESS', { userId: user.id, ...metadata });
  }

  async changePassword(
    userId: string,
    input: ChangePasswordInput,
    metadata: { ip?: string; userAgent?: string },
  ): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    if (!(await verifyPassword(user.passwordHash, input.oldPassword))) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    if (input.oldPassword === input.newPassword) {
      throw new BadRequestError('New password must differ from the current one');
    }

    const passwordHash = await hashPassword(input.newPassword);
    await userRepository.updatePassword(user.id, passwordHash);

    // Revoke all refresh tokens to force re-login on other devices
    await refreshTokenRepository.revokeAllForUser(user.id);

    await auditService.log('PASSWORD_CHANGE', { userId: user.id, ...metadata });
  }

  async verifyEmail(token: string, metadata: { ip?: string; userAgent?: string }): Promise<void> {
    const tokenHash = sha256(token);
    const stored = await emailVerificationTokenRepository.findByHash(tokenHash);

    if (!stored || stored.used || stored.expiresAt < new Date()) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    await userRepository.markVerified(stored.userId);
    await emailVerificationTokenRepository.markUsed(stored.id);

    await auditService.log('EMAIL_VERIFICATION_SUCCESS', { userId: stored.userId, ...metadata });
  }

  async resendVerificationEmail(
    userId: string,
    metadata: { ip?: string; userAgent?: string },
  ): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    if (user.isVerified) throw new BadRequestError('Email already verified');

    await emailVerificationTokenRepository.invalidateAllForUser(user.id);

    const token = generateRandomToken();
    await emailVerificationTokenRepository.create({
      userId: user.id,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + ONE_DAY),
    });

    await emailService.sendVerificationEmail(user.email, token);
    await auditService.log('EMAIL_VERIFICATION_REQUEST', { userId: user.id, ...metadata });
  }
}

export const authService = new AuthService();