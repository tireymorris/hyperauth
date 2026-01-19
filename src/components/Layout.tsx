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
      <html
        lang="en"
        class="font-inter min-h-screen bg-black bg-gradient-to-br from-black via-gray-900/95 to-black text-white antialiased"
        hx-boost="true"
      >
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="description" content="HyperAuth" />
          <title>{title || 'HyperAuth'}</title>
          <link rel="icon" href="/favicon.png" type="image/x-icon" />
          <link rel="stylesheet" href="/styles/uno.css" />
          {raw(`<script src="https://unpkg.com/htmx.org@1.9.10/dist/htmx.min.js"></script>`)}
          {raw(`<script src="https://unpkg.com/htmx.org@1.9.10/dist/ext/class-tools.js"></script>`)}
          {createRawInlineScript(
            'htmx-config',
            `htmx.config.globalViewTransitions = false; 
             htmx.config.historyCacheSize = 10;
             htmx.config.refreshOnHistoryMiss = true;`
          )}
          <style>{`
            * {
              box-sizing: border-box;
              margin: 0;
              outline: none;
              color: unset;
            }

            input, button, a {
              -webkit-tap-highlight-color: transparent !important;
              -webkit-user-select: none !important;
              -webkit-touch-callout: none !important;
              user-select: none !important;
              outline: none !important;
              outline-offset: none !important;
            }

            button {
              cursor: pointer;
              outline: none !important;
              outline-offset: none !important;
              -webkit-tap-highlight-color: transparent !important;
            }

            button:focus {
              outline: none !important;
              outline-offset: none !important;
              box-shadow: none !important;
            }

            button:focus-visible {
              outline: none !important;
              outline-offset: none !important;
              box-shadow: none !important;
            }
          `}</style>
        </head>
        <body class="flex min-h-screen w-full flex-col items-center justify-start">
          {error ? (
            <Toast
              type="error"
              message={
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
            <Toast type="warning" message={warningMessage} />
          ) : successMessage ? (
            <Toast type="success" message={successMessage} />
          ) : null}
          {showNav && (
            <Navigation {...(userEmail && { userEmail })} currentPath={pathname} hasOrganization={hasOrganization} />
          )}
          <main
            class={`mx-auto w-full ${
              pathname === '/dashboard' || pathname === '/admin'
                ? 'max-w-none px-5 pb-3'
                : pathname.startsWith('/auth') || pathname.startsWith('/login')
                  ? 'max-w-4xl px-4 py-2'
                  : 'max-w-6xl px-4 py-2'
            }`}
          >
            <div
              class={`rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-lg transition-all duration-300 hover:border-white/20 ${
                pathname === '/dashboard' ? 'p-0' : 'min-w-[360px] p-6 md:min-w-[480px]'
              }`}
            >
              <div class={pathname !== '/dashboard' ? spacingClasses[spacing] : ''}>{children}</div>
            </div>
          </main>
          <div id="modal-container" class="fixed inset-0 z-[9000] hidden">
            <div id="modal-content" class="hidden"></div>
          </div>
          <div id="dashboard-modal-container" class="hidden"></div>
        </body>
      </html>
    </>
  );
};

export default Layout;
