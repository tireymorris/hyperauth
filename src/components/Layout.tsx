import type { Child, FC } from 'hono/jsx';
import type { Context } from 'hono';
import type { TokenPayload } from '@/lib/auth/constants';
import Navigation from '@/components/Navigation';
import Toast from '@/components/Toast';
import { getUserFromContext } from '@/lib/auth/session';
import { logHandler } from '@/middleware/logger';
import { raw } from 'hono/html';

type LayoutProps = {
  title: string;
  currentPath?: string;
  children: Child;
  c: Context;
  notification?: {
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
  };
  userEmail?: string;
  justLoggedIn?: boolean;
  spacing?: 'sm' | 'md' | 'lg';
  authenticatedUser?: TokenPayload | null;
};

const Layout: FC<LayoutProps> = ({ title, children, c, spacing = 'lg', authenticatedUser }) => {
  const currentUser = authenticatedUser || getUserFromContext(c);
  const userEmail = currentUser?.email;
  const pathname = c.req.path || '/';
  const isAuthPage = pathname === '/auth';
  const showNav = !!currentUser && !isAuthPage;
  const error = c.req.query('error');
  const successMessage = c.req.query('success');
  const warningMessage = c.req.query('warning');

  logHandler.debug('ui', 'Rendering layout', {
    userEmail,
    error,
    successMessage,
    warningMessage,
  });

  const spacingClasses = {
    sm: 'space-y-4',
    md: 'space-y-6',
    lg: 'space-y-8',
  };

  return (
    <>
      {raw('<!DOCTYPE html>')}
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="description" content="HyperAuth - Secure Authentication" />
          <title>{title || 'HyperAuth'}</title>
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="stylesheet" href="/styles/tailwind.css" />
        </head>
        <body class="flex min-h-screen w-full flex-col items-center justify-center p-4 bg-slate-950">
          {error ? (
            <Toast
              variant="destructive"
              description={
                error === 'invalid_token' || error === 'tampered_token'
                  ? 'Your verification link is invalid or has expired. Please request a new one.'
                  : error === 'expired_token'
                    ? 'Your verification link has expired. Please request a new one.'
                    : error === 'token_revoked'
                      ? 'This verification link has already been used. Please request a new one.'
                      : error === 'verification_required'
                        ? 'Please verify your email to continue.'
                        : 'An error occurred. Please try again.'
              }
            />
          ) : warningMessage ? (
            <Toast variant="default" description={warningMessage} />
          ) : successMessage ? (
            <Toast variant="default" description={successMessage} />
          ) : null}

          {showNav && <Navigation {...(userEmail && { userEmail })} currentPath={pathname} />}

          <main class="relative z-10 w-full max-w-md">
            <div class="bg-slate-900 border border-slate-800 rounded-lg p-8 shadow-xl">
              <div class={spacingClasses[spacing]}>{children}</div>
            </div>
          </main>
        </body>
      </html>
    </>
  );
};

export default Layout;
