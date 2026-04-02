import { logHandler } from '@/middleware/logger';
import { Database } from 'bun:sqlite';

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const BLACKLIST_RETENTION_MS = 24 * 60 * 60 * 1000;

export interface AuthProvider {
  storeToken(token: string, email: string, expiresInSeconds: number): Promise<void>;
  validateToken(token: string, email: string): Promise<boolean>;
  invalidateToken(token: string): Promise<void>;
  blacklistToken(token: string): Promise<void>;
  isBlacklisted(token: string): Promise<boolean>;
}

class SQLiteAuthProvider implements AuthProvider {
  private db!: Database;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.db = new Database('auth.db', { create: true });

    this.db.run(`
      CREATE TABLE IF NOT EXISTS tokens (
        token TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS blacklist (
        token TEXT PRIMARY KEY,
        blacklisted_at INTEGER NOT NULL
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_tokens_email ON tokens(email)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_tokens_expires_at ON tokens(expires_at)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_blacklist_at ON blacklist(blacklisted_at)
    `);

    setInterval(() => {
      this.cleanupExpiredTokens();
      this.cleanupOldBlacklist();
    }, CLEANUP_INTERVAL_MS);

    logHandler.info('auth', 'SQLite auth provider initialized');
  }

  private cleanupExpiredTokens(): void {
    const now = Date.now();
    const result = this.db.run('DELETE FROM tokens WHERE expires_at < ?', [now]);
    const deletedCount = result.changes;

    if (deletedCount > 0) {
      logHandler.debug('auth', 'Cleaned up expired tokens from database', { count: deletedCount });
    }
  }

  private cleanupOldBlacklist(): void {
    const cutoff = Date.now() - BLACKLIST_RETENTION_MS;
    const result = this.db.run('DELETE FROM blacklist WHERE blacklisted_at < ?', [cutoff]);
    const deletedCount = result.changes;

    if (deletedCount > 0) {
      logHandler.debug('auth', 'Cleaned up old blacklist entries', { count: deletedCount });
    }
  }

  async storeToken(token: string, email: string, expiresInSeconds: number): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const expiresAt = Date.now() + expiresInSeconds * 1000;

    this.db.run('INSERT OR REPLACE INTO tokens (token, email, expires_at) VALUES (?, ?, ?)', [
      token,
      normalizedEmail,
      expiresAt,
    ]);

    logHandler.debug('auth', 'Token stored in SQLite database', {
      email: normalizedEmail,
      expiresInSeconds,
    });
  }

  async validateToken(token: string, email: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    const now = Date.now();

    const result = this.db.query('SELECT email, expires_at FROM tokens WHERE token = ?').get(token) as
      | { email: string; expires_at: number }
      | undefined;

    if (!result) {
      logHandler.debug('auth', 'Token not found in database', { email: normalizedEmail });
      return false;
    }

    if (result.email !== normalizedEmail) {
      logHandler.warn('auth', 'Token email mismatch', {
        expected: normalizedEmail,
        actual: result.email,
      });
      return false;
    }

    if (result.expires_at < now) {
      await this.invalidateToken(token);
      logHandler.debug('auth', 'Token expired and removed from database', { email: normalizedEmail });
      return false;
    }

    return true;
  }

  async invalidateToken(token: string): Promise<void> {
    const result = this.db.run('DELETE FROM tokens WHERE token = ?', [token]);
    if (result.changes > 0) {
      logHandler.debug('auth', 'Token invalidated in database');
    }
  }

  async blacklistToken(token: string): Promise<void> {
    const now = Date.now();
    this.db.run('INSERT OR REPLACE INTO blacklist (token, blacklisted_at) VALUES (?, ?)', [token, now]);
    logHandler.debug('auth', 'Token added to blacklist');
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const result = this.db.query('SELECT token FROM blacklist WHERE token = ?').get(token);
    return result !== null && result !== undefined;
  }
}

let authProvider: AuthProvider | null = null;

async function initializeAuthProvider(): Promise<void> {
  authProvider = new SQLiteAuthProvider();
  logHandler.info('api', `Auth provider initialized: ${authProvider.constructor.name}`);
}

export async function getAuthProvider(): Promise<AuthProvider> {
  if (!authProvider) {
    await initializeAuthProvider();
  }

  if (!authProvider) throw new Error('Auth provider not initialized');

  return authProvider;
}
