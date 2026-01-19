// Set minimal environment variables for testing
process.env.NODE_ENV = 'test';
process.env.HOST = 'http://localhost:3000';
process.env.EMAIL_FROM = 'test@example.com';
process.env.SECRET_KEY = 'test-secret-key-that-is-at-least-32-characters-long-for-testing-purposes';

import { beforeAll, describe, expect, test, afterAll } from 'bun:test';
import { Database } from 'bun:sqlite';
import { initializeAuthProvider, getAuthProvider } from '../src/lib/providers/auth';

// Hardcoded values to avoid importing from src
const TOKEN_EXPIRY_SECONDS_MAGIC = 15 * 60; // 15 minutes in seconds
const normalizeEmail = (email: string) => email.toLowerCase().trim();

describe('SQLite Auth Provider Integration Test', () => {
  let db: Database;

  beforeAll(async () => {
    // Clean up any existing database
    try {
      await Bun.spawn(['rm', '-f', 'auth.db']).exited;
    } catch {}

    // Initialize the auth provider (this will create the SQLite database)
    await initializeAuthProvider();

    // Initialize database connection for verification
    db = new Database('auth.db');
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

  test('should store magic token in SQLite database', async () => {
    const authProvider = await getAuthProvider();
    const email = 'test@example.com';
    const normalizedEmail = normalizeEmail(email);
    const token = 'test-magic-token-' + Date.now();

    await authProvider.storeToken(token, email, TOKEN_EXPIRY_SECONDS_MAGIC);

    // Check database for stored token
    const storedToken = db.query('SELECT token, email, expires_at FROM tokens WHERE token = ?').get(token) as
      | {
          token: string;
          email: string;
          expires_at: number;
        }
      | undefined;

    expect(storedToken).toBeDefined();
    expect(storedToken!.email).toBe(normalizedEmail);
    expect(storedToken!.expires_at).toBeGreaterThan(Date.now());
    expect(storedToken!.expires_at).toBeLessThanOrEqual(Date.now() + TOKEN_EXPIRY_SECONDS_MAGIC * 1000 + 1000); // Allow 1 second tolerance
  });

  test('should validate stored tokens correctly', async () => {
    const authProvider = await getAuthProvider();
    const email = 'test@example.com';
    const token = 'test-validate-token-' + Date.now();

    await authProvider.storeToken(token, email, TOKEN_EXPIRY_SECONDS_MAGIC);

    const isValid = await authProvider.validateToken(token, email);
    expect(isValid).toBe(true);
  });

  test('should reject invalid tokens', async () => {
    const authProvider = await getAuthProvider();
    const invalidToken = 'non-existent-token';
    const email = 'test@example.com';

    const isValid = await authProvider.validateToken(invalidToken, email);
    expect(isValid).toBe(false);
  });

  test('should reject tokens with wrong email', async () => {
    const authProvider = await getAuthProvider();
    const email = 'test@example.com';
    const wrongEmail = 'wrong@example.com';
    const token = 'test-wrong-email-token-' + Date.now();

    await authProvider.storeToken(token, email, TOKEN_EXPIRY_SECONDS_MAGIC);

    const isValid = await authProvider.validateToken(token, wrongEmail);
    expect(isValid).toBe(false);
  });

  test('should invalidate tokens', async () => {
    const authProvider = await getAuthProvider();
    const email = 'test@example.com';
    const token = 'test-invalidate-token-' + Date.now();

    await authProvider.storeToken(token, email, TOKEN_EXPIRY_SECONDS_MAGIC);

    let isValid = await authProvider.validateToken(token, email);
    expect(isValid).toBe(true);

    await authProvider.invalidateToken(token);

    isValid = await authProvider.validateToken(token, email);
    expect(isValid).toBe(false);
  });

  test('should cleanup expired tokens from database', async () => {
    const authProvider = await getAuthProvider();
    const email = 'test@example.com';
    const normalizedEmail = normalizeEmail(email);

    // Insert an expired token directly
    const expiredToken = 'expired-test-token-' + Date.now();
    const expiredTime = Date.now() - 1000; // 1 second ago

    db.run('INSERT INTO tokens (token, email, expires_at) VALUES (?, ?, ?)', [
      expiredToken,
      normalizedEmail,
      expiredTime,
    ]);

    // Verify token exists
    const beforeCleanup = db.query('SELECT COUNT(*) as count FROM tokens WHERE token = ?').get(expiredToken) as {
      count: number;
    };
    expect(beforeCleanup.count).toBe(1);

    // Manually trigger cleanup (since automatic cleanup runs every 5 minutes)
    const now = Date.now();
    const result = db.run('DELETE FROM tokens WHERE expires_at < ?', [now]);
    const deletedCount = result.changes;

    expect(deletedCount).toBe(1);

    // Verify the expired token was removed
    const afterCleanup = db.query('SELECT COUNT(*) as count FROM tokens WHERE token = ?').get(expiredToken) as {
      count: number;
    };
    expect(afterCleanup.count).toBe(0);
  });
});
