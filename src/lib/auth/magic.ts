import { generateToken } from '@/lib/auth/tokens';
import { TOKEN_EXPIRY_SECONDS } from '@/lib/auth/constants';
import { z } from 'zod';
import { getAuthProvider } from '@/lib/providers';

export async function generateMagicLink(email: string): Promise<{ token: string | null; error: string | null }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !z.string().email().safeParse(normalizedEmail).success) {
    return { token: null, error: 'Invalid email format' };
  }

  try {
    const authProvider = await getAuthProvider();
    const token = await generateToken({ type: 'magic', email: normalizedEmail, role: 'user' });
    await authProvider.storeToken(token, normalizedEmail, TOKEN_EXPIRY_SECONDS.magic);

    return { token, error: null };
  } catch {
    return { token: null, error: 'Failed to generate magic link' };
  }
}

export async function validateMagicLink(token: string, email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !z.string().email().safeParse(normalizedEmail).success) {
    return false;
  }

  try {
    const authProvider = await getAuthProvider();
    const isValid = await authProvider.validateToken(token, normalizedEmail);

    if (isValid) {
      await authProvider.invalidateToken(token);
    }

    return isValid;
  } catch {
    return false;
  }
}
