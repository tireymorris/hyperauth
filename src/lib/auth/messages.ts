import { ERROR_CODES } from '@/lib/auth/constants';

const DEFAULT_MESSAGE = 'An error occurred. Please try again.';

export function messageForAuthQueryError(code: string): string {
  switch (code) {
    case ERROR_CODES.INVALID:
    case ERROR_CODES.TAMPERED:
      return 'Your verification link is invalid or has expired. Please request a new one.';
    case ERROR_CODES.EXPIRED:
      return 'Your verification link has expired. Please request a new one.';
    case ERROR_CODES.REVOKED:
      return 'This verification link has already been used. Please request a new one.';
    case ERROR_CODES.VERIFICATION_REQUIRED:
      return 'Please verify your email to continue.';
    default:
      return DEFAULT_MESSAGE;
  }
}
