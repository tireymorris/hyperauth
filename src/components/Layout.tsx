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
          <link rel="stylesheet" href="/styles/uno.css" />
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
          <style>{`
            :root {
              --glass-bg: rgba(255, 255, 255, 0.03);
              --glass-border: rgba(255, 255, 255, 0.08);
              --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
              --accent-cyan: #06b6d4;
              --accent-violet: #8b5cf6;
              --accent-rose: #f43f5e;
            }

            * {
              box-sizing: border-box;
              margin: 0;
              outline: none;
            }

            html {
              font-family: 'Outfit', system-ui, sans-serif;
              background: #030712;
              min-height: 100vh;
            }

            body {
              min-height: 100vh;
              background: 
                radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6, 182, 212, 0.15), transparent),
                radial-gradient(ellipse 60% 40% at 100% 100%, rgba(139, 92, 246, 0.1), transparent),
                radial-gradient(ellipse 40% 60% at 0% 100%, rgba(244, 63, 94, 0.08), transparent),
                #030712;
              color: #e2e8f0;
              overflow-x: hidden;
            }

            @keyframes float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-20px) rotate(2deg); }
            }

            @keyframes pulse-glow {
              0%, 100% { opacity: 0.4; transform: scale(1); }
              50% { opacity: 0.6; transform: scale(1.05); }
            }

            @keyframes shimmer {
              0% { background-position: -200% center; }
              100% { background-position: 200% center; }
            }

            .orb {
              position: fixed;
              border-radius: 50%;
              filter: blur(80px);
              pointer-events: none;
              z-index: 0;
            }

            .orb-1 {
              width: 400px;
              height: 400px;
              background: rgba(6, 182, 212, 0.15);
              top: -100px;
              right: -100px;
              animation: float 8s ease-in-out infinite;
            }

            .orb-2 {
              width: 300px;
              height: 300px;
              background: rgba(139, 92, 246, 0.12);
              bottom: -50px;
              left: -50px;
              animation: float 10s ease-in-out infinite reverse;
            }

            .orb-3 {
              width: 200px;
              height: 200px;
              background: rgba(244, 63, 94, 0.1);
              top: 50%;
              left: 50%;
              animation: pulse-glow 6s ease-in-out infinite;
            }

            .glass-card {
              background: var(--glass-bg);
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
              border: 1px solid var(--glass-border);
              border-radius: 24px;
              box-shadow: var(--glass-shadow);
              position: relative;
              overflow: hidden;
            }

            .glass-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 1px;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            }

            .glass-input {
              background: rgba(255, 255, 255, 0.02);
              border: 1px solid rgba(255, 255, 255, 0.06);
              border-radius: 12px;
              padding: 14px 18px;
              color: #f1f5f9;
              font-size: 15px;
              font-family: 'Outfit', sans-serif;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              width: 100%;
            }

            .glass-input::placeholder {
              color: rgba(148, 163, 184, 0.6);
            }

            .glass-input:hover {
              border-color: rgba(255, 255, 255, 0.12);
              background: rgba(255, 255, 255, 0.04);
            }

            .glass-input:focus {
              outline: none;
              border-color: rgba(6, 182, 212, 0.5);
              background: rgba(255, 255, 255, 0.05);
              box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
            }

            .glass-button {
              background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2));
              border: 1px solid rgba(6, 182, 212, 0.3);
              border-radius: 12px;
              padding: 14px 24px;
              color: #f1f5f9;
              font-size: 15px;
              font-weight: 500;
              font-family: 'Outfit', sans-serif;
              cursor: pointer;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              position: relative;
              overflow: hidden;
            }

            .glass-button::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 200%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
              transition: left 0.5s ease;
            }

            .glass-button:hover {
              background: linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(139, 92, 246, 0.3));
              border-color: rgba(6, 182, 212, 0.5);
              transform: translateY(-2px);
              box-shadow: 0 10px 40px rgba(6, 182, 212, 0.2);
            }

            .glass-button:hover::before {
              left: 100%;
            }

            .glass-button:active {
              transform: translateY(0);
            }

            .glass-button-secondary {
              background: rgba(255, 255, 255, 0.03);
              border: 1px solid rgba(255, 255, 255, 0.08);
            }

            .glass-button-secondary:hover {
              background: rgba(255, 255, 255, 0.06);
              border-color: rgba(255, 255, 255, 0.15);
              box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            }

            .gradient-text {
              background: linear-gradient(135deg, #06b6d4, #8b5cf6);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }

            .text-glow {
              text-shadow: 0 0 30px rgba(6, 182, 212, 0.3);
            }

            input, button, a {
              -webkit-tap-highlight-color: transparent !important;
            }

            button:focus, button:focus-visible {
              outline: none !important;
            }

            .fade-in {
              animation: fadeIn 0.5s ease-out;
            }

            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </head>
        <body class="flex min-h-screen w-full flex-col items-center justify-center p-4">
          <div class="orb orb-1"></div>
          <div class="orb orb-2"></div>
          <div class="orb orb-3"></div>

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
