import type { Context } from 'hono';
import type { TokenPayload } from '@/lib/auth/constants';
import { logHandler } from '@/middleware/logger';

export function getUserFromContext(c: Context): TokenPayload | null {
  try {
    const user = c.get('user');
    if (!user || typeof user !== 'object') {
      return null;
    }

    const userObj = user as TokenPayload;
    if (!userObj.email || !userObj.role || !userObj.type) {
      return null;
    }

    logHandler.debug('auth', 'getUserFromContext completed successfully', { context: 'getUserFromContext' });
    return userObj;
  } catch (error) {
    logHandler.error('auth', 'getUserFromContext failed', { context: 'getUserFromContext', error });
    return null;
  }
}
