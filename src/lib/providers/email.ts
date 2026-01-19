import { Resend } from 'resend';
import { env } from '@/utils/env';
import { logHandler } from '@/middleware/logger';

export interface EmailResult {
  error: Error | null;
  data?: { id: string } | undefined;
}

export interface EmailProvider {
  send(email: { from: string; to: string; subject: string; html: string }): Promise<EmailResult>;
}

class ResendEmailProvider implements EmailProvider {
  private resend: Resend;

  constructor() {
    const apiKey = env('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    this.resend = new Resend(apiKey);
    logHandler.info('email', 'Resend email provider initialized');
  }

  async send(email: { from: string; to: string; subject: string; html: string }): Promise<EmailResult> {
    try {
      const data = await this.resend.emails.send({
        from: email.from,
        to: email.to,
        subject: email.subject,
        html: email.html,
      });
      logHandler.debug('email', 'Email sent successfully', { to: email.to, subject: email.subject });
      return { error: null, data: data.data ?? undefined };
    } catch (error) {
      logHandler.error('email', 'Failed to send email', { error, to: email.to });
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
}

let emailProvider: EmailProvider | null = null;

export async function initializeEmailProvider(): Promise<void> {
  emailProvider = new ResendEmailProvider();
  logHandler.info('api', `Email provider initialized: ${emailProvider.constructor.name}`);
}

export function getEmailProvider(): EmailProvider {
  if (!emailProvider) {
    throw new Error('Email provider not initialized');
  }
  return emailProvider;
}
