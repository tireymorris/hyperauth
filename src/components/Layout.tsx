import type { Child, FC } from 'hono/jsx';
import type { Context } from 'hono';
import type { TokenPayload } from '@/lib/auth/constants';
import Navigation from '@/components/Navigation';
import Toast from '@/components/Toast';
import ToastRegion from '@/components/ToastRegion';
import { messageForAuthQueryError } from '@/lib/auth/messages';
import { getUserFromContext } from '@/lib/auth/session';
import { cn } from '@/lib/utils';
import { logHandler } from '@/middleware/logger';
import { raw } from 'hono/html';

type LayoutProps = {
  title: string;
  children: Child;
  c: Context;
  userEmail?: string;
  authenticatedUser?: TokenPayload | null;
};

const Layout: FC<LayoutProps> = ({ title, children, c, authenticatedUser }) => {
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

  const toastNode = error ? (
    <Toast variant="destructive" description={messageForAuthQueryError(error)} />
  ) : warningMessage ? (
    <Toast variant="default" description={warningMessage} />
  ) : successMessage ? (
    <Toast variant="default" description={successMessage} />
  ) : null;

  const hasToast = toastNode !== null;

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
        <body
          className={cn(
            'flex min-h-screen w-full flex-col items-center justify-center bg-slate-950 p-4',
            hasToast && 'pt-28 sm:pt-32'
          )}
        >
          {hasToast ? <ToastRegion>{toastNode}</ToastRegion> : null}

          {showNav && <Navigation {...(userEmail && { userEmail })} />}

          <main className="relative z-10 w-full max-w-md">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 shadow-xl">
              <div className="space-y-8">{children}</div>
            </div>
          </main>
        </body>
      </html>
    </>
  );
};

export default Layout;
