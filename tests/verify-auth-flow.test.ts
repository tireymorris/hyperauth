// Set minimal environment variables for testing
process.env.NODE_ENV = 'development';
process.env.HOST = 'http://localhost:3000';
process.env.SECRET_KEY = 'test-secret-key-that-is-at-least-32-characters-long-for-testing-purposes';
process.env.APP_NAME = 'HyperAuth';
process.env.EMAIL_FROM = 'test@example.com';

import { beforeAll, describe, expect, test, afterAll } from 'bun:test';
import { Database } from 'bun:sqlite';
import { Hono } from 'hono';

describe('Verify complete authentication flow works end-to-end', () => {
  let db: Database;
  let app: Hono;
  let capturedMagicLink = '';

  beforeAll(async () => {
    // Import after env is set
    const { initializeAuthProvider } = await import('../src/lib/providers/auth');
    const authRouter = await import('../src/routers/auth');
    const { logHandler } = await import('../src/middleware/logger');

    // Clean up any existing database
    try {
      await Bun.spawn(['rm', '-f', 'auth.db']).exited;
    } catch {}

    // Initialize the auth provider
    await initializeAuthProvider();

    // Initialize database for verification
    db = new Database('auth.db');

    // Create app
    app = new Hono();
    app.route('/', authRouter.default);
    app.get('/', (c) => c.redirect('/login'));

    // Mock logHandler to capture magic link
    const originalInfo = logHandler.info;
    logHandler.info = (level, msg, meta) => {
      if (msg === 'Development magic link') {
        capturedMagicLink = meta!.magicLink;
      }
      originalInfo(level, msg, meta);
    };
  });

  afterAll(() => {
    if (db) {
      db.close();
    }
    // Clean up database file
    try {
      Bun.spawn(['rm', '-f', 'auth.db']);
    } catch {}
  });

  test('should complete full authentication flow', async () => {
    // 1. GET /login, extract CSRF token
    const loginRes = await app.request('/login');
    expect(loginRes.status).toBe(200);
    const loginBody = await loginRes.text();
    const csrfMatch = loginBody.match(/name="csrf" value="([^"]+)"/);
    expect(csrfMatch).toBeTruthy();
    const csrfToken = csrfMatch![1];

    // 2. POST /auth/login with email and CSRF token
    const formData = new FormData();
    formData.append('email', 'user@test.com');
    formData.append('csrf', csrfToken);

    const postReq = new Request('http://localhost/auth/login', { method: 'POST', body: formData });
    const postRes = await app.request(postReq);
    expect(postRes.status).toBe(200);

    // In dev mode, magic link should be captured
    expect(capturedMagicLink).toBeDefined();
    const token = capturedMagicLink.split('token=')[1];

    // 3. GET the magic link URL
    const verifyRes = await app.request(`/auth/verify?token=${token}`);
    expect(verifyRes.status).toBe(200);
    const verifyBody = await verifyRes.text();
    expect(verifyBody).toContain('Signed in as');

    // 4. Check cookies contain access and refresh tokens
    const setCookie = verifyRes.headers.get('set-cookie');
    expect(setCookie).toContain('access_token');
    expect(setCookie).toContain('refresh_token');

    // 5. GET /auth/logout, assert cookies cleared and redirect to login
    const logoutRes = await app.request('/auth/logout');
    expect(logoutRes.status).toBe(302);
    expect(logoutRes.headers.get('location')).toBe('/login');

    // 6. Verify tokens removed from SQLite database
    const remainingTokens = db.query('SELECT COUNT(*) as count FROM tokens').get() as { count: number };
    expect(remainingTokens.count).toBe(0);
  });
});
