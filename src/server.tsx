import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { serveStatic } from '@hono/node-server/serve-static';
import { env } from '@/utils/env';
import { contextLog, logHandler, logging } from '@/middleware/logger';
import { errorHandler } from '@/middleware/error-handler';
import authRouter from '@/routers/auth';
import { secureHeaders } from 'hono/secure-headers';
import { HTTP_STATUS } from '@/utils/constants';
import Layout from '@/components/Layout';
import Button from '@/components/Button';

const app = new Hono();
logHandler.info('http', 'Initializing server', {
  environment: env('NODE_ENV'),
  skipAuth: env('SKIP_AUTH') === 'true',
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
app.use('/favicon.png', serveStatic({ path: './public/favicon.png' }));

app.route('/', authRouter);

app.get('/', (c) => c.redirect('/login'));

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
      <h2 class="text-xl font-bold text-red-500">❌ Page not found</h2>
      <p class="mt-2 text-gray-300">The page you're looking for doesn't exist.</p>
      <Button hx-get="/" hx-target="body" hx-swap="outerHTML" className="mt-4">
        Go back home
      </Button>
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
