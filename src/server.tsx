import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { serveStatic } from '@hono/node-server/serve-static';
import { getCookie } from 'hono/cookie';
import { env } from '@/utils/env';
import { contextLog, logHandler, logging } from '@/middleware/logger';
import { errorHandler } from '@/middleware/error-handler';
import authRouter from '@/routers/auth';
import { secureHeaders } from 'hono/secure-headers';
import { HTTP_STATUS } from '@/utils/constants';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import { verifyToken } from '@/lib/auth';

const app = new Hono();
logHandler.info('http', 'Initializing server', {
  environment: env('NODE_ENV'),
});

app.use('*', logging());
app.use(
  '*',
  cors({
    origin: env('NODE_ENV') === 'production' ? env('HOST') : '*',
    credentials: true,
  })
);
app.use('*', prettyJSON());
app.use('*', errorHandler());
app.use('*', secureHeaders());

app.use('/assets/*', serveStatic({ root: './public' }));
app.use('/styles/*', serveStatic({ root: './public' }));
app.use('/js/*', serveStatic({ root: './public' }));
app.use('/images/*', serveStatic({ root: './public' }));
app.use('/favicon.svg', serveStatic({ path: './public/favicon.svg' }));

app.route('/', authRouter);

app.get('/', async (c) => {
  const accessToken = getCookie(c, 'access_token');

  if (!accessToken) {
    return c.redirect('/login');
  }

  try {
    const payload = await verifyToken(accessToken);
    logHandler.debug('http', 'Home page - user authenticated', { email: payload.email });

    return c.html(
      <Layout title="Home" c={c} userEmail={payload.email}>
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-400">
              Signed in as <span className="text-cyan-400 font-medium">{payload.email}</span>
            </p>
          </div>
          <a href="/auth/logout" className="block">
            <Button variant="secondary" className="w-full">
              Sign out
            </Button>
          </a>
        </div>
      </Layout>
    );
  } catch {
    logHandler.debug('http', 'Home page - invalid token, redirecting to login');
    return c.redirect('/login');
  }
});

app.notFound((c) => {
  logHandler.warn('http', 'Not found', { path: c.req.path });

  c.status(HTTP_STATUS.NOT_FOUND);

  const path = c.req.path;
  if (
    path.startsWith('/assets/') ||
    path.startsWith('/styles/') ||
    path.startsWith('/js/') ||
    path.startsWith('/images/')
  ) {
    return c.json({ error: 'File not found', path }, HTTP_STATUS.NOT_FOUND);
  }

  return c.html(
    <Layout title="Not Found" c={c}>
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-500/10 border border-slate-500/20">
          <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Page not found</h2>
          <p className="mt-2 text-sm text-slate-400">The page you're looking for doesn't exist.</p>
        </div>
        <a href="/" className="block">
          <Button variant="secondary" className="w-full">
            Go back home
          </Button>
        </a>
      </div>
    </Layout>
  );
});

app.onError((err, c) => {
  contextLog(c, 'system', 'error', 'Global error handler triggered', {
    error:
      err instanceof Error
        ? {
            message: err.message,
            name: err.name,
            stack: err.stack || 'No stack trace available',
            ...('status' in err && typeof err.status === 'number' && { status: err.status }),
          }
        : String(err),
    path: c.req.path,
    method: c.req.method,
    userAgent: c.req.header('user-agent'),
    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1',
  });

  const status =
    err instanceof Error && 'status' in err && typeof err.status === 'number'
      ? err.status
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;
  return new Response(JSON.stringify({ error: { status, message: err.message || 'Internal server error' } }), {
    status,
  });
});

const port = parseInt(env('PORT'), 10);
logHandler.info('system', `Server starting on port ${port}...`);

serve({ fetch: app.fetch, port }, (info) => {
  logHandler.info('system', `Server started on port ${info.port}`);
});
