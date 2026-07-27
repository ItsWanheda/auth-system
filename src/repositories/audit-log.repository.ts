import type { AuditLog } from '@prisma/client';
import { prisma } from '../prisma/prisma.client';

export class AuditLogRepository {
  async create(data: {
    action: string;
    userId?: string | null;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AuditLog> {
    return prisma.auditLog.create({
      data: {
        action: data.action,
        user: data.userId ? { connect: { id: data.userId } } : undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  }

  async findByUserId(userId: string, limit = 50): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const auditLogRepository = new AuditLogRepository();