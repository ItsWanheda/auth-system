import { auditLogRepository } from '../repositories/audit-log.repository';

export type AuditAction =
  | 'USER_SIGNUP'
  | 'USER_LOGIN_SUCCESS'
  | 'USER_LOGIN_FAILED'
  | 'USER_LOGOUT'
  | 'TOKEN_REFRESH'
  | 'TOKEN_REFRESH_REUSE_DETECTED'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_SUCCESS'
  | 'EMAIL_VERIFICATION_REQUEST'
  | 'EMAIL_VERIFICATION_SUCCESS';

export class AuditService {
  async log(
    action: AuditAction,
    options: {
      userId?: string | null;
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, unknown>;
    } = {},
  ): Promise<void> {
    try {
      await auditLogRepository.create({
        action,
        user: options.userId ? { connect: { id: options.userId } } : undefined,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        metadata: options.metadata ?? undefined,
      });
    } catch {
      // Never let audit logging break the request
    }
  }
}

export const auditService = new AuditService();