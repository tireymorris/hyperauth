import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { COOKIE_CONFIG, COOKIE_OPTIONS, ERROR_CODES, ERROR_CODE_MAP, TOKEN_EXPIRY_SECONDS } from '@/lib/auth/constants';
import { blacklistToken, generateCsrfToken, generateToken, verifyToken } from '@/lib/auth/tokens';
import { sendMagicLink, validateMagicLink } from '@/lib/auth/magic';

import { contextLog, logHandler } from '@/middleware/logger';
import { AUTH_RATE_LIMITS, rateLimiter } from '@/middleware/rate-limiter';
import { env } from '@/utils/env';
import { normalizeEmail } from '@/utils/email';
import { getAuthProvider } from '@/lib/providers';
import { z } from 'zod';
import { type Context, Hono } from 'hono';
import Layout from '@/components/Layout';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { HTTP_STATUS } from '@/utils/constants';

const authRouter = new Hono();

authRouter.use('/auth/login', rateLimiter(AUTH_RATE_LIMITS.login));
authRouter.use('/auth/verify', rateLimiter(AUTH_RATE_LIMITS.verify));
authRouter.use('/auth/refresh', rateLimiter(AUTH_RATE_LIMITS.refresh));

authRouter.get('/auth/logout', async (c: Context) => {
  const accessToken = getCookie(c, COOKIE_CONFIG.access.name);
  const refreshToken = getCookie(c, COOKIE_CONFIG.refresh.name);
  const emailChanged = c.req.query('emailChanged');
  const message = c.req.query('message');

  if (accessToken) await blacklistToken(accessToken);
  if (refreshToken) await blacklistToken(refreshToken);

  deleteCookie(c, COOKIE_CONFIG.access.name, {
    ...COOKIE_OPTIONS,
    path: COOKIE_CONFIG.access.path,
  });
  deleteCookie(c, COOKIE_CONFIG.refresh.name, {
    ...COOKIE_OPTIONS,
    path: COOKIE_CONFIG.refresh.path,
  });

  const redirectUrl = emailChanged && message ? `/login?success=${encodeURIComponent(message)}` : '/login';

  if (c.req.header('HX-Request')) {
    c.header('HX-Redirect', redirectUrl);
    logHandler.debug('auth', 'User logged out', { emailChanged: !!emailChanged });
    return c.body(null);
  }
  return c.redirect(redirectUrl);
});

authRouter.get('/login', async (c) => {
  logHandler.debug('http', 'Login page requested');
  const csrfToken = await generateCsrfToken();
  logHandler.debug('token', 'Generated CSRF token');
  return c.html(
    <Layout title="Sign in" c={c}>
      <form action="/auth/login" method="post" class="space-y-6">
        <input type="hidden" name="csrf" value={csrfToken} />

        <div class="text-center space-y-3">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 mb-2">
            <svg class="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 class="text-2xl font-semibold gradient-text text-glow">Welcome back</h1>
          <p class="text-sm text-slate-400">Enter your email to receive a secure login link</p>
        </div>

        <div class="space-y-2">
          <label for="email" class="block text-sm font-medium text-slate-300">
            Email address
          </label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required />
        </div>

        <Button variant="primary" className="w-full" type="submit">
          Continue with email
        </Button>
      </form>

      <div class="mt-8 pt-6 border-t border-white/5">
        <p class="text-center text-xs text-slate-500">
          Protected by <span class="text-slate-400 font-medium">HyperAuth</span>
          <span class="mx-2 text-slate-600">•</span>
          <span class="text-slate-500">End-to-end encrypted</span>
        </p>
      </div>
    </Layout>,
    HTTP_STATUS.OK
  );
});

authRouter.post('/auth/login', async (c) => {
  const formData = await c.req.parseBody();
  const rawEmail = formData['email']?.toString();
  const email = rawEmail ? normalizeEmail(rawEmail) : '';
  const csrfToken = formData['csrf']?.toString();

  if (!csrfToken) {
    return c.json({ error: 'Missing CSRF token' }, HTTP_STATUS.FORBIDDEN);
  }

  try {
    await verifyToken(csrfToken);
    logHandler.debug('auth', 'CSRF token verified successfully', {
      truncatedToken: csrfToken.substring(0, 20) + '...',
    });
  } catch (csrfError) {
    logHandler.error('auth', 'verifyCsrfToken failed', {
      truncatedToken: csrfToken.substring(0, 20) + '...',
      error: csrfError,
    });
    return c.json({ error: 'Invalid CSRF token' }, HTTP_STATUS.FORBIDDEN);
  }

  if (!email || !z.string().email().safeParse(email).success) {
    logHandler.warn('auth', 'Invalid email format', { email });
    c.status(HTTP_STATUS.BAD_REQUEST);
    return c.html(
      <Layout title="Invalid Email" c={c}>
        <div class="text-center space-y-6">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <svg class="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-slate-100">Invalid email format</h2>
            <p class="mt-2 text-sm text-slate-400">Please enter a valid email address to continue.</p>
          </div>
          <Button hx-get="/login" hx-target="body" hx-swap="outerHTML" variant="secondary" className="w-full">
            Try again
          </Button>
        </div>
      </Layout>
    );
  }

  try {
    logHandler.info('user', 'Processing magic link request', { email });

    if (env('NODE_ENV') === 'development') {
      const authProvider = await getAuthProvider();
      const token = await generateToken({ type: 'magic', email, role: 'user' });
      await authProvider.storeToken(token, email, TOKEN_EXPIRY_SECONDS.magic);
      logHandler.info('token', 'Magic link token stored', { email });

      const host = env('HOST');
      const magicLink = `${host}/auth/verify?token=${token}`;
      logHandler.info('auth', 'Development magic link', { magicLink });

      c.status(HTTP_STATUS.OK);
      return c.html(
        <Layout title="Development Login" c={c}>
          <div class="text-center space-y-6">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <svg class="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-semibold text-slate-100">Development mode</h2>
              <p class="mt-2 text-sm text-slate-400">Check the console for the magic link URL.</p>
            </div>
            <Button hx-get="/login" hx-target="body" hx-swap="outerHTML" variant="secondary" className="w-full">
              Back to login
            </Button>
          </div>
        </Layout>
      );
    }

    const result = await sendMagicLink(email);
    if (result.error) {
      logHandler.error('auth', 'Failed to send magic link', { error: result.error });
      c.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      return c.html(
        <Layout title="Error Sending Link" c={c}>
          <div class="text-center space-y-6">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <svg class="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-semibold text-slate-100">Unable to send link</h2>
              <p class="mt-2 text-sm text-slate-400">
                There was an issue sending the login link. Please try again later.
              </p>
            </div>
            <Button hx-get="/login" hx-target="body" hx-swap="outerHTML" variant="secondary" className="w-full">
              Try again
            </Button>
          </div>
        </Layout>
      );
    }

    logHandler.info('auth', 'Magic link process completed', { email });
    c.status(HTTP_STATUS.OK);
    return c.html(
      <Layout title="Check Your Email" c={c}>
        <div class="text-center space-y-6">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
            <svg class="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-slate-100">Check your inbox</h2>
            <p class="mt-2 text-sm text-slate-400">
              We've sent a magic link to <span class="text-cyan-400 font-medium">{email}</span>
            </p>
          </div>
          <div class="pt-4 border-t border-white/5">
            <p class="text-xs text-slate-500">Can't find the email? Check your spam folder.</p>
          </div>
        </div>
      </Layout>
    );
  } catch (error) {
    logHandler.error('auth', 'Login process failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    c.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    return c.html(
      <Layout title="Error" c={c}>
        <div class="text-center space-y-6">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <svg class="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-slate-100">Something went wrong</h2>
            <p class="mt-2 text-sm text-slate-400">An unexpected error occurred. Please try again later.</p>
          </div>
          <Button hx-get="/login" hx-target="body" hx-swap="outerHTML" variant="secondary" className="w-full">
            Try again
          </Button>
        </div>
      </Layout>
    );
  }
});

authRouter.get('/auth/verify', async (c) => {
  const token = c.req.query('token');
  logHandler.debug('auth', 'Verifying token', { token });

  if (!token) {
    logHandler.warn('auth', 'Missing verification token');
    c.status(HTTP_STATUS.BAD_REQUEST);
    return c.redirect(`/login?error=${ERROR_CODES.VERIFICATION_REQUIRED}`, HTTP_STATUS.REDIRECT);
  }

  try {
    const payload = await verifyToken(token);
    if (payload.type !== 'magic') {
      throw new Error('Invalid token type');
    }
    if (!payload.email || typeof payload.email !== 'string') {
      throw new Error('Invalid token payload');
    }

    logHandler.debug('token', 'Validating magic link token against storage', { email: payload.email });
    const isValid = await validateMagicLink(token, payload.email);
    if (!isValid) {
      logHandler.warn('token', 'Token not found in storage or invalid', { email: payload.email });
      throw new Error('Token not found or invalid');
    }
    logHandler.debug('token', 'Token validated successfully against storage', { email: payload.email });

    logHandler.debug('auth', 'verifyMagicLinkToken completed successfully', {
      truncatedToken: token.substring(0, 20) + '...',
    });

    const accessToken = await generateToken({ type: 'access', email: payload.email, role: payload.role });
    const refreshToken = await generateToken({ type: 'refresh', email: payload.email, role: payload.role });
    logHandler.debug('auth', 'Generated session tokens');

    setCookie(c, COOKIE_CONFIG.access.name, accessToken, {
      ...COOKIE_OPTIONS,
      path: COOKIE_CONFIG.access.path,
      maxAge: COOKIE_CONFIG.access.maxAge,
      expires: new Date(Date.now() + COOKIE_CONFIG.access.maxAge * 1000),
    });

    setCookie(c, COOKIE_CONFIG.refresh.name, refreshToken, {
      ...COOKIE_OPTIONS,
      path: COOKIE_CONFIG.refresh.path,
      maxAge: COOKIE_CONFIG.refresh.maxAge,
    });

    logHandler.debug('auth', 'Cookies set, showing redirect page');

    await blacklistToken(token);
    logHandler.debug('auth', 'Blacklisted magic token');

    return c.html(
      <Layout title="Welcome" c={c} authenticatedUser={payload}>
        <div class="text-center space-y-6">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <svg class="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-slate-100">You're in!</h2>
            <p class="mt-2 text-sm text-slate-400">
              Signed in as <span class="text-cyan-400 font-medium">{payload.email}</span>
            </p>
          </div>
          <a href="/" class="block">
            <Button variant="primary" className="w-full">
              Continue to dashboard
            </Button>
          </a>
        </div>
      </Layout>
    );
  } catch (verifyError) {
    logHandler.warn('auth', 'Token verification failed', {
      error: verifyError,
      truncatedToken: token.substring(0, 20) + '...',
    });
    const errorCode =
      verifyError instanceof Error && 'code' in verifyError && verifyError.code
        ? (ERROR_CODE_MAP[verifyError.code as keyof typeof ERROR_CODE_MAP] ?? ERROR_CODES.INVALID)
        : ERROR_CODES.INVALID;
    return c.redirect(`/login?error=${errorCode}`, HTTP_STATUS.REDIRECT);
  }
});

authRouter.all('/auth/refresh', async (c) => {
  const isGet = c.req.method === 'GET';
  const redirectUrl = isGet ? c.req.query('redirect') : null;
  const refreshToken = getCookie(c, COOKIE_CONFIG.refresh.name);

  contextLog(c, 'auth', 'debug', 'Refresh token request received', {
    method: c.req.method,
    hasToken: Boolean(refreshToken),
    tokenLength: refreshToken?.length,
    hasRedirect: Boolean(redirectUrl),
  });

  if (!refreshToken) {
    contextLog(c, 'auth', 'warn', 'Missing refresh token');
    return isGet ? c.redirect('/login') : c.json({ message: 'Unauthorized' }, HTTP_STATUS.UNAUTHORIZED);
  }

  try {
    contextLog(c, 'auth', 'debug', 'Attempting to verify refresh token');

    const payload = await verifyToken(refreshToken);

    contextLog(c, 'auth', 'debug', 'Refresh token verified', {
      email: payload.email,
      type: payload.type,
    });

    if (payload.type !== 'refresh') {
      contextLog(c, 'auth', 'warn', 'Invalid token type', { type: payload.type });
      return isGet ? c.redirect('/login') : c.json({ message: 'Invalid token' }, HTTP_STATUS.FORBIDDEN);
    }

    const newAccessToken = await generateToken({ type: 'access', email: payload.email, role: payload.role });
    contextLog(c, 'auth', 'debug', 'Generated new access token');

    setCookie(c, COOKIE_CONFIG.access.name, newAccessToken, {
      ...COOKIE_OPTIONS,
      path: COOKIE_CONFIG.access.path,
      maxAge: COOKIE_CONFIG.access.maxAge,
      expires: new Date(Date.now() + COOKIE_CONFIG.access.maxAge * 1000),
    });

    if (isGet) {
      const targetUrl = redirectUrl || '/login';
      contextLog(c, 'auth', 'debug', 'Redirecting after token refresh', { targetUrl });
      return c.redirect(targetUrl);
    }

    return c.json({ message: 'Token refreshed' }, HTTP_STATUS.OK);
  } catch (error) {
    contextLog(c, 'auth', 'error', 'Failed to refresh token', {
      error: error instanceof Error ? error.message : String(error),
      code: error instanceof Error && 'code' in error ? (error as { code: string }).code : 'unknown',
    });

    return isGet
      ? c.redirect('/login')
      : c.json({ message: 'Failed to refresh token' }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

export default authRouter;
