import { z } from 'zod';

/**
 * Schéma de validation des variables d'environnement, vérifié au démarrage.
 * Si une variable requise manque ou est invalide, l'app refuse de démarrer.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGINS: z.string().default('*'),

  DATABASE_URL: z.string().url(),
  // Tolérant : si la référence Railway ${{Redis.REDIS_URL}} ne se résout pas
  // (service Redis absent / mal nommé), on retombe sur localhost au lieu de
  // crasher au démarrage. L'app boote alors en mode "Redis dégradé" (lazyConnect),
  // et le master OTP — qui n'utilise pas Redis — reste utilisable pour tester.
  REDIS_URL: z
    .string()
    .default('redis://localhost:6379')
    .transform((v) => (/^rediss?:\/\/.+/.test(v) ? v : 'redis://localhost:6379')),

  JWT_ACCESS_SECRET: z.string().min(8),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_SECRET: z.string().min(8),
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(2_592_000),

  OTP_TTL: z.coerce.number().int().positive().default(300),
  OTP_LENGTH: z.coerce.number().int().min(4).max(8).default(6),
  // OTP « passe-partout » pour les tests (login + création de compte).
  // Laisser vide/non défini pour désactiver. Ignoré en production (sécurité).
  DEV_MASTER_OTP: z.string().optional(),
  SMS_PROVIDER: z.enum(['console', 'twilio']).default('console'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional(),

  PAYMENT_PROVIDER: z.enum(['mock', 'flexpay', 'stripe']).default('mock'),
  PAYMENT_WEBHOOK_SECRET: z.string().min(8),
  FLEXPAY_API_KEY: z.string().optional(),
  FLEXPAY_MERCHANT: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  EXPO_ACCESS_TOKEN: z.string().optional(),

  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_REGION: z.string().default('auto'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Configuration d'environnement invalide :\n${issues}`);
  }
  return parsed.data;
}
