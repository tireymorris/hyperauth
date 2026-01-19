import type { Context, MiddlewareHandler, Next } from 'hono';
import { logHandler } from '@/middleware/logger';
import { HTTP_STATUS } from '@/utils/constants';

interface RateLimitConfig {
  max: number;
  windowMs: number;
  message: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

function getClientIdentifier(c: Context): string {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || '127.0.0.1';
  return ip;
}

export function rateLimiter(config: RateLimitConfig): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const clientId = getClientIdentifier(c);
    const key = `${clientId}:${c.req.path}`;
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      entry = {
        count: 0,
        resetAt: now + config.windowMs,
      };
    }

    entry.count++;
    rateLimitStore.set(key, entry);

    const remaining = Math.max(0, config.max - entry.count);
    const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);

    c.header('X-RateLimit-Limit', String(config.max));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(resetInSeconds));

    if (entry.count > config.max) {
      logHandler.warn('rate', 'Rate limit exceeded', {
        clientId,
        path: c.req.path,
        count: entry.count,
        max: config.max,
      });

      c.header('Retry-After', String(resetInSeconds));

      return c.json(
        {
          error: config.message,
          retryAfter: resetInSeconds,
        },
        HTTP_STATUS.TOO_MANY_REQUESTS
      );
    }

    await next();
    return c.res;
  };
}

export const AUTH_RATE_LIMITS = {
  login: {
    max: 10,
    windowMs: 5 * 60 * 1000,
    message: 'Too many login attempts. Please try again in a few minutes.',
  },
  verify: {
    max: 10,
    windowMs: 5 * 60 * 1000,
    message: 'Too many verification attempts. Please request a new magic link.',
  },
  refresh: {
    max: 30,
    windowMs: 5 * 60 * 1000,
    message: 'Too many refresh attempts. Please log in again.',
  },
} as const;
