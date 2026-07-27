import type { EmailVerificationToken } from '@prisma/client';
import { prisma } from '../prisma/prisma.client';

export class EmailVerificationTokenRepository {
  async create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<EmailVerificationToken> {
    return prisma.emailVerificationToken.create({ data });
  }

  async findByHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    return prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
  }

  async markUsed(id: string): Promise<EmailVerificationToken> {
    return prisma.emailVerificationToken.update({
      where: { id },
      data: { used: true },
    });
  }

  async invalidateAllForUser(userId: string): Promise<{ count: number }> {
    return prisma.emailVerificationToken.updateMany({
      where: { userId, used: false },
      data: { used: true },
    });
  }
}

export const emailVerificationTokenRepository = new EmailVerificationTokenRepository();