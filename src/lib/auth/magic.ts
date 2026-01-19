import { generateToken } from '@/lib/auth/tokens';
import { TOKEN_EXPIRY_SECONDS } from '@/lib/auth/constants';
import { env } from '@/utils/env';
import { normalizeEmail } from '@/utils/email';
import { logHandler } from '@/middleware/logger';
import { z } from 'zod';
import { getEmailProvider } from '@/lib/providers/email';
import { getAuthProvider } from '@/lib/providers';

export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !z.string().email().safeParse(normalizedEmail).success) {
    logHandler.warn('auth', 'Invalid email format', { email: normalizedEmail });
    return { error: 'Invalid email format' };
  }

  try {
    const authProvider = await getAuthProvider();
    logHandler.debug('auth', 'User verified or created for magic link', { email: normalizedEmail });

    const token = await generateToken({ type: 'magic', email: normalizedEmail, role: 'user' });
    logHandler.debug('auth', 'Generated magic link token', { email: normalizedEmail, tokenLength: token.length });

    await authProvider.storeToken(token, normalizedEmail, TOKEN_EXPIRY_SECONDS.magic);
    logHandler.debug('auth', 'Stored magic link token', {
      email: normalizedEmail,
      expiry: TOKEN_EXPIRY_SECONDS.magic,
    });

    const host = env('HOST');
    const appName = env('APP_NAME');
    const magicLink = `${host}/auth/verify?token=${token}`;
    logHandler.debug('auth', 'Created magic link URL', {
      email,
      host,
      appName,
      url: magicLink.substring(0, magicLink.indexOf('?')),
    });

    const emailProvider = getEmailProvider();
    logHandler.debug('auth', 'Initialized email provider', {
      email,
      provider: emailProvider.constructor.name,
    });

    logHandler.info('auth', 'Sending magic link email', { email });

    const mailResponse = await emailProvider.send({
      from: env('EMAIL_FROM'),
      to: email,
      subject: '🔑 Your magic link to sign in',
      html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Your Magic Login Link</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.5;
                  margin: 0;
                  padding: 0;
                  -webkit-font-smoothing: antialiased;
                  -moz-osx-font-smoothing: grayscale;
                  background: #000;
                  background-image: linear-gradient(to bottom right, #000, rgba(17, 24, 39, 0.95), #000);
                  min-height: 100vh;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 40px 20px;
                }
                .wrapper {
                  background: rgba(17, 24, 39, 0.7);
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  border-radius: 16px;
                  padding: 32px;
                  color: #fff;
                }
                .logo {
                  margin-bottom: 32px;
                  text-align: center;
                }
                h1 {
                  color: #fff;
                  font-size: 24px;
                  font-weight: 600;
                  margin: 0 0 24px;
                  text-align: center;
                }
                p {
                  color: rgba(255, 255, 255, 0.8);
                  margin: 0 0 24px;
                  text-align: center;
                }
                .button {
                  background: linear-gradient(to right, #3b82f6, #2563eb);
                  border-radius: 6px;
                  color: #fff;
                  display: inline-block;
                  font-weight: 500;
                  padding: 12px 24px;
                  text-decoration: none;
                  text-align: center;
                  width: 100%;
                  max-width: 300px;
                }
                .button:hover {
                  background: linear-gradient(to right, #2563eb, #1d4ed8);
                }
                .link {
                  color: #3b82f6;
                  word-break: break-all;
                }
                .footer {
                  margin-top: 32px;
                  color: rgba(255, 255, 255, 0.5);
                  font-size: 14px;
                  text-align: center;
                }
                .main-content {
                  margin-bottom: 32px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="wrapper">
                  <div class="logo">
                    <img src="${host}/favicon.png" alt="${appName}" width="64" height="64" />
                  </div>
                  <div class="main-content">
                    <h1>Welcome to ${appName}!</h1>
                    <p>Click the button below to log in to your account. This link will expire in 15 minutes.</p>
                    <p style="text-align: center;">
                      <a href="${magicLink}" class="button">Log in to ${appName}</a>
                    </p>
                    <p style="margin-top: 24px; font-size: 14px;">
                      If the button doesn't work, copy and paste this link into your browser:<br>
                      <a href="${magicLink}" class="link">${magicLink}</a>
                    </p>
                  </div>
                  <div class="footer">
                    <p>This email was sent by ${appName}. If you didn't request this email, you can safely ignore it.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
    });

    if (mailResponse.error) {
      logHandler.error('auth', 'Failed to send magic link email', {
        email,
        error: mailResponse.error,
        errorMessage: mailResponse.error.message,
        errorStack: mailResponse.error.stack,
        from: env('EMAIL_FROM'),
        providerType: emailProvider.constructor.name,
      });
      return { error: 'Failed to send magic link email' };
    }

    logHandler.info('auth', 'Magic link email sent successfully', {
      email,
      messageId: mailResponse.data?.id,
    });

    return { error: null };
  } catch (error) {
    logHandler.error('auth', 'Failed to send magic link', {
      email,
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    return { error: 'Failed to send magic link' };
  }
}

export async function validateMagicLink(token: string, email: string): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !z.string().email().safeParse(normalizedEmail).success) {
    logHandler.warn('auth', 'Invalid email format for magic link validation', { email: normalizedEmail });
    return false;
  }

  try {
    const authProvider = await getAuthProvider();
    const storage = await authProvider.validateToken(token, normalizedEmail);
    logHandler.debug('auth', 'Magic link token validation result', { email: normalizedEmail, isValid: storage });

    if (storage) {
      await authProvider.invalidateToken(token);
      logHandler.info('auth', 'Magic link token validated and invalidated', { email: normalizedEmail });
    } else {
      logHandler.warn('auth', 'Invalid magic link token', {
        email: normalizedEmail,
        tokenLength: token.length,
      });
    }

    return storage;
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logHandler.error('auth', 'Error validating magic link', {
      email,
      errorMessage: errorObj.message,
      errorStack: errorObj.stack,
      errorName: errorObj.name,
    });
    return false;
  }
}

export async function sendInvitationMagicLink(
  email: string,
  inviterName?: string,
  organizationName?: string
): Promise<{ error: string | null }> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !z.string().email().safeParse(normalizedEmail).success) {
    logHandler.warn('auth', 'Invalid email format for invitation', { email: normalizedEmail });
    return { error: 'Invalid email format' };
  }

  try {
    const authProvider = await getAuthProvider();
    logHandler.debug('auth', 'User verified or created for invitation magic link', { email: normalizedEmail });

    const token = await generateToken({ type: 'magic', email: normalizedEmail, role: 'user' });
    logHandler.debug('auth', 'Generated invitation magic link token', {
      email: normalizedEmail,
      tokenLength: token.length,
    });

    await authProvider.storeToken(token, normalizedEmail, TOKEN_EXPIRY_SECONDS.magic);
    logHandler.debug('auth', 'Stored invitation magic link token', {
      email: normalizedEmail,
      expiry: TOKEN_EXPIRY_SECONDS.magic,
    });

    const host = env('HOST');
    const appName = env('APP_NAME');
    const magicLink = `${host}/auth/verify?token=${token}`;
    logHandler.debug('auth', 'Created invitation magic link URL', {
      email,
      host,
      appName,
      url: magicLink.substring(0, magicLink.indexOf('?')),
    });

    const emailProvider = getEmailProvider();
    logHandler.debug('auth', 'Initialized email provider for invitation', {
      email,
      provider: emailProvider.constructor.name,
    });

    logHandler.info('auth', 'Sending invitation magic link email', { email, inviterName, organizationName });

    const invitationText = inviterName
      ? `${inviterName} has invited you to join ${organizationName || 'their team'} on ${appName}.`
      : `You've been invited to join ${organizationName || 'a team'} on ${appName}.`;

    const mailResponse = await emailProvider.send({
      from: env('EMAIL_FROM'),
      to: email,
      subject: `🎯 You're invited to join ${organizationName || 'the team'} on ${appName}`,
      html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>You're Invited to Join ${organizationName || 'the Team'}</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.5;
                  margin: 0;
                  padding: 0;
                  -webkit-font-smoothing: antialiased;
                  -moz-osx-font-smoothing: grayscale;
                  background: #000;
                  background-image: linear-gradient(to bottom right, #000, rgba(17, 24, 39, 0.95), #000);
                  min-height: 100vh;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 40px 20px;
                }
                .wrapper {
                  background: rgba(17, 24, 39, 0.7);
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  border-radius: 16px;
                  padding: 32px;
                  color: #fff;
                }
                .logo {
                  margin-bottom: 32px;
                  text-align: center;
                }
                h1 {
                  color: #fff;
                  font-size: 24px;
                  font-weight: 600;
                  margin: 0 0 24px;
                  text-align: center;
                }
                p {
                  color: rgba(255, 255, 255, 0.8);
                  margin: 0 0 24px;
                  text-align: center;
                }
                .button {
                  background: linear-gradient(to right, #3b82f6, #2563eb);
                  border-radius: 6px;
                  color: #fff;
                  display: inline-block;
                  font-weight: 500;
                  padding: 12px 24px;
                  text-decoration: none;
                  text-align: center;
                  width: 100%;
                  max-width: 300px;
                }
                .button:hover {
                  background: linear-gradient(to right, #2563eb, #1d4ed8);
                }
                .link {
                  color: #3b82f6;
                  word-break: break-all;
                }
                .footer {
                  margin-top: 32px;
                  color: rgba(255, 255, 255, 0.5);
                  font-size: 14px;
                  text-align: center;
                }
                .main-content {
                  margin-bottom: 32px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="wrapper">
                  <div class="logo">
                    <img src="${host}/favicon.png" alt="${appName}" width="64" height="64" />
                  </div>
                  <div class="main-content">
                    <h1>You're invited to join ${organizationName || 'the team'}!</h1>
                    <p>${invitationText}</p>
                    <p>Click the button below to accept your invitation and get started. This link will expire in 15 minutes.</p>
                    <p style="text-align: center;">
                      <a href="${magicLink}" class="button">Accept invitation</a>
                    </p>
                    <p style="margin-top: 24px; font-size: 14px;">
                      If the button doesn't work, copy and paste this link into your browser:<br>
                      <a href="${magicLink}" class="link">${magicLink}</a>
                    </p>
                  </div>
                  <div class="footer">
                    <p>This invitation was sent by ${appName}. If you weren't expecting this invitation, you can safely ignore this email.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
    });

    if (mailResponse.error) {
      logHandler.error('auth', 'Failed to send invitation magic link email', {
        email,
        error: mailResponse.error,
        errorMessage: mailResponse.error.message,
        errorStack: mailResponse.error.stack,
        from: env('EMAIL_FROM'),
        providerType: emailProvider.constructor.name,
      });
      return { error: 'Failed to send invitation email' };
    }

    logHandler.info('auth', 'Invitation magic link email sent successfully', {
      email,
      messageId: mailResponse.data?.id,
      inviterName,
      organizationName,
    });

    return { error: null };
  } catch (error) {
    logHandler.error('auth', 'Failed to send invitation magic link', {
      email,
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    return { error: 'Failed to send invitation email' };
  }
}
