import { env } from '../config/env';
import { logger } from '../config/logger';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Mock email service. Replace `send()` with nodemailer / SES / SendGrid in production.
 * Set EMAIL_ENABLED=true to enable logging emails to console.
 */
export class EmailService {
  async send(message: EmailMessage): Promise<void> {
    if (!env.EMAIL_ENABLED) {
      logger.debug({ to: message.to, subject: message.subject }, '[EmailMock] message suppressed');
      return;
    }
    logger.info(
      {
        from: env.EMAIL_FROM,
        to: message.to,
        subject: message.subject,
      },
      '[EmailMock] would send email',
    );
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const link = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    await this.send({
      to: email,
      subject: 'Verify your email address',
      text: `Click this link to verify your email: ${link}\n\nThis link expires in 24 hours.`,
      html: `<p>Click <a href="${link}">here</a> to verify your email. Link expires in 24 hours.</p>`,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    await this.send({
      to: email,
      subject: 'Reset your password',
      text: `Click this link to reset your password: ${link}\n\nThis link expires in 1 hour.`,
      html: `<p>Click <a href="${link}">here</a> to reset your password. Link expires in 1 hour.</p>`,
    });
  }
}

export const emailService = new EmailService();