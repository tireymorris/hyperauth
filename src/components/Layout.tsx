import type { Child, FC } from 'hono/jsx';
import type { Context } from 'hono';
import type { TokenPayload } from '@/lib/auth/constants';
import Navigation from '@/components/Navigation';
import Toast from '@/components/Toast';
import { getUserFromContext } from '@/lib/auth/session';
import { logHandler } from '@/middleware/logger';
import { raw } from 'hono/html';
import { createRawInlineScript } from '@/utils/script-loader';

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
  const isLandingPage =
    pathname === '/landing' || pathname === '/purchase' || pathname === '/demo' || pathname.startsWith('/purchase/');
  const showNav = (!!currentUser || isLandingPage) && !isAuthPage;
  const error = c.req.query('error');
  const justLoggedIn = c.req.query('justLoggedIn');
  const successMessage = c.req.query('success');
  const warningMessage = c.req.query('warning');

  const organizationId = c.get('organizationId');
  const hasOrganization = Boolean(organizationId);

  logHandler.debug('ui', 'Rendering layout', {
    userEmail,
    error,
    successMessage,
    warningMessage,
    justLoggedIn,
    hasOrganization,
  });

  const spacingClasses = {
    sm: 'space-y-4',
    md: 'space-y-6',
    lg: 'space-y-8',
  };

  return (
    <>
      {raw('<!DOCTYPE html>')}
      <html lang="en" hx-boost="true">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="description" content="HyperAuth - Secure Authentication" />
          <title>{title || 'HyperAuth'}</title>
          <link rel="icon" href="/favicon.png" type="image/x-icon" />
          <link rel="stylesheet" href="/styles/tailwind.css" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap"
            rel="stylesheet"
          />
          {raw(`<script src="https://unpkg.com/htmx.org@1.9.10/dist/htmx.min.js"></script>`)}
          {raw(`<script src="https://unpkg.com/htmx.org@1.9.10/dist/ext/class-tools.js"></script>`)}
          {createRawInlineScript(
            'htmx-config',
            `htmx.config.globalViewTransitions = false; 
             htmx.config.historyCacheSize = 10;
             htmx.config.refreshOnHistoryMiss = true;`
          )}
        </head>
        <body class="flex min-h-screen w-full flex-col items-center justify-center p-4">
          <div class="orb orb-1"></div>
          <div class="orb orb-2"></div>
          <div class="orb orb-3"></div>

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

          {showNav && (
            <Navigation {...(userEmail && { userEmail })} currentPath={pathname} hasOrganization={hasOrganization} />
          )}

          <main class="relative z-10 w-full max-w-md fade-in">
            <div class="glass-card p-8">
              <div class={spacingClasses[spacing]}>{children}</div>
            </div>
          </main>

          <div id="modal-container" class="fixed inset-0 z-[9000] hidden">
            <div id="modal-content" class="hidden"></div>
          </div>
        </body>
      </html>
    </>
  );
};

export default Layout;
