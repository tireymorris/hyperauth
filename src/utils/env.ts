import { z } from 'zod';
import { logHandler } from '@/middleware/logger';

const DEFAULT_SECRET_KEY_LENGTH = 32;
const DEFAULT_HTTP_PORT = 3000;

const envSchema = z.object({
  APP_NAME: z.string().default('HyperAuth'),
  HOST: z.string().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(DEFAULT_HTTP_PORT),
  SECRET_KEY: z.string().min(DEFAULT_SECRET_KEY_LENGTH).default('development-secret-key-min-32-chars!!'),
});

type EnvKey = keyof z.infer<typeof envSchema>;

export function env(key: EnvKey): string {
  try {
    const parsed = envSchema.parse(process.env);
    const value = parsed[key];
    if (value === undefined) {
      return '';
    }
    return String(value);
  } catch (error) {
    logHandler.error('http', `Failed to retrieve environment variable: ${key}`, { error });
    throw new Error(`Failed to retrieve environment variable: ${key}`);
  }
}
