import type { PasswordResetToken } from '@prisma/client';
import { prisma } from '../prisma/prisma.client';

export class PasswordResetTokenRepository {
  async create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({ data });
  }

  async findByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  }

  async markUsed(id: string): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.update({
      where: { id },
      data: { used: true },
    });
  }

  async invalidateAllForUser(userId: string): Promise<{ count: number }> {
    return prisma.passwordResetToken.updateMany({
      where: { userId, used: false },
      data: { used: true },
    });
  }
}

export const passwordResetTokenRepository = new PasswordResetTokenRepository();