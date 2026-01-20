// Set minimal environment variables for testing
process.env.NODE_ENV = 'development';
process.env.HOST = 'http://localhost:3000';
process.env.SECRET_KEY = 'test-secret-key-that-is-at-least-32-characters-long-for-testing-purposes';
process.env.APP_NAME = 'HyperAuth';
process.env.EMAIL_FROM = 'test@example.com';

import { describe, expect, test } from 'bun:test';
import { Hono } from 'hono';

describe('Toast integration test', () => {
  test('should display error toast when error query parameter is present', async () => {
    // Import auth router and create minimal app
    const authRouter = await import('../src/routers/auth');

    const app = new Hono();
    app.route('/', authRouter.default);
    app.get('/', (c) => c.redirect('/login'));

    // Make request to a page with error query parameter
    const response = await app.request('/login?error=invalid_token');
    expect(response.status).toBe(200);

    const html = await response.text();

    // Assert toast appears with correct message and styling
    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="assertive"');
    expect(html).toContain('aria-atomic="true"');
    expect(html).toContain('Your verification link is invalid or has expired');
    expect(html).toContain('destructive'); // variant for error
  });

  test('should not display toast when no toast query parameters are present', async () => {
    // Import auth router and create minimal app
    const authRouter = await import('../src/routers/auth');

    const app = new Hono();
    app.route('/', authRouter.default);
    app.get('/', (c) => c.redirect('/login'));

    // Make request to a page without toast query parameters
    const response = await app.request('/login');
    expect(response.status).toBe(200);

    const html = await response.text();

    // Assert no toast appears
    expect(html).not.toContain('role="alert"');
  });
});
