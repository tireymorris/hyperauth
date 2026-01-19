import { SignJWT, jwtVerify } from 'jose';
import { logHandler } from '@/middleware/logger';
import { env } from '@/utils/env';
import {
  JOSE_ERROR_CODES,
  type JoseError,
  TOKEN_EXPIRY_SECONDS,
  TOKEN_TYPES,
  type TokenPayload,
  USER_ROLES,
} from '@/lib/auth/constants';
import { getAuthProvider } from '@/lib/providers/auth';
import { z } from 'zod';

let signingKey: Uint8Array | null = null;

const MIN_KEY_LENGTH_BYTES = 32;

function getKey(): Uint8Array {
  if (!signingKey) {
    const key = env('SECRET_KEY');

    if (key.length < MIN_KEY_LENGTH_BYTES) {
      logHandler.error('token', 'SECRET_KEY is too short', {
        required: MIN_KEY_LENGTH_BYTES,
        actual: key.length,
      });
      throw new Error(`SECRET_KEY must be at least ${MIN_KEY_LENGTH_BYTES} characters`);
    }

    signingKey = new TextEncoder().encode(key);
  }
  return signingKey;
}

export async function blacklistToken(token: string): Promise<void> {
  const authProvider = await getAuthProvider();
  await authProvider.blacklistToken(token);
}

export async function generateToken(payload: TokenPayload): Promise<string> {
  if (!TOKEN_TYPES.includes(payload.type)) {
    logHandler.error('token', 'Non-standard token type', { payload });
    throw new Error('Non-standard token type');
  }

  const expiry = `${TOKEN_EXPIRY_SECONDS[payload.type]}s`;
  logHandler.debug('token', 'Generating token', { type: payload.type, expiry });

  const tokenPayload = {
    type: payload.type,
    role: payload.role,
    email: payload.email,
  } satisfies TokenPayload;

  const jwt = await new SignJWT(tokenPayload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(getKey());

  logHandler.debug('token', 'Token generated successfully', { type: payload.type });
  return jwt;
}

export async function generateCsrfToken(): Promise<string> {
  const payload: TokenPayload = {
    type: 'csrf' as const,
    role: 'user',
    email: 'csrf@hyperauth.local',
  };

  const expiry = `${TOKEN_EXPIRY_SECONDS['csrf']}s`;
  logHandler.debug('token', 'Generating CSRF token', { expiry });

  const csrfPayload = {
    ...payload,
    type: 'csrf' as const,
  };

  const jwt = await new SignJWT(csrfPayload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(getKey());

  logHandler.debug('token', 'CSRF token generated successfully');
  return jwt;
}

function createTokenError(message: string, code: string): JoseError {
  const error = new Error(message) as JoseError;
  error.code = code;
  return error;
}

interface ValidationRule {
  check: (payload: Partial<TokenPayload>) => boolean;
  errorCode: (typeof JOSE_ERROR_CODES)[keyof typeof JOSE_ERROR_CODES];
  message: string;
}

const tokenValidationRules: ValidationRule[] = [
  {
    check: (payload): boolean => {
      const type = payload.type;
      return type !== undefined && TOKEN_TYPES.includes(type);
    },
    errorCode: JOSE_ERROR_CODES.CLAIM_VALIDATION_FAILED,
    message: 'Invalid token type',
  },
  {
    check: (payload): boolean => {
      const role = payload.role;
      return role !== undefined && USER_ROLES.includes(role);
    },
    errorCode: JOSE_ERROR_CODES.CLAIM_VALIDATION_FAILED,
    message: 'Invalid role',
  },
  {
    check: (payload): boolean => {
      const email = payload.email;
      const type = payload.type;
      return email !== undefined && (type === 'csrf' || z.string().email().safeParse(email).success);
    },
    errorCode: JOSE_ERROR_CODES.CLAIM_VALIDATION_FAILED,
    message: 'Invalid email format',
  },
  {
    check: (payload): boolean => payload['exp'] !== undefined && payload['iat'] !== undefined,
    errorCode: JOSE_ERROR_CODES.CLAIM_VALIDATION_FAILED,
    message: 'Missing required claims',
  },
  {
    check: (payload): boolean => {
      const now = Math.floor(Date.now() / 1000);
      return payload['exp'] !== undefined && Number(payload['exp']) > now;
    },
    errorCode: JOSE_ERROR_CODES.EXPIRED,
    message: 'Token has expired',
  },
  {
    check: (payload): boolean => {
      const now = Math.floor(Date.now() / 1000);
      return payload['iat'] !== undefined && Number(payload['iat']) <= now;
    },
    errorCode: JOSE_ERROR_CODES.CLAIM_VALIDATION_FAILED,
    message: 'Token not yet valid',
  },
];

export async function validateTokenPayload(tokenPayload: Partial<TokenPayload>): Promise<void> {
  logHandler.debug('token', 'Validating token payload', { type: tokenPayload.type });

  for (const rule of tokenValidationRules) {
    if (!rule.check(tokenPayload)) {
      logHandler.error('token', rule.message);
      throw createTokenError(rule.message, rule.errorCode);
    }
  }

  logHandler.debug('token', 'Token payload validated successfully');
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  if (!token) {
    logHandler.error('token', 'Token is empty');
    throw createTokenError('Token is empty', JOSE_ERROR_CODES.INVALID_FORMAT);
  }

  const authProvider = await getAuthProvider();
  const isBlacklisted = await authProvider.isBlacklisted(token);
  if (isBlacklisted) {
    logHandler.error('token', 'Token is blacklisted');
    throw createTokenError('Token is blacklisted', JOSE_ERROR_CODES.REVOKED);
  }

  const key = getKey();
  const { payload } = await jwtVerify(token, key);
  const tokenPayload = payload as unknown as TokenPayload;

  await validateTokenPayload(tokenPayload);
  logHandler.debug('token', 'Token verified successfully', { type: tokenPayload.type });
  return tokenPayload;
}

export async function resetBlacklist(): Promise<void> {
  logHandler.debug('token', 'Token blacklist reset requested (no-op for persistent storage)');
}
