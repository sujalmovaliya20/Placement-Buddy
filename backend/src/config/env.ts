/**
 * Environment configuration — validates all env vars at startup using Zod.
 *
 * Fails fast with clear error messages if any required variable is missing
 * or has an invalid format. Validated once and exported as a frozen object.
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI must be a valid connection string'),
  COLLEGE_EMAIL_DOMAIN: z.string().default('college.edu'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters in production')
    .default('dev-secret-change-me'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
  WHATSAPP_GROUP_ID: z.string().optional().default(''),
  OPENWA_API_URL: z.string().default('http://localhost:2785'),
  OPENWA_API_KEY: z.string().optional().default(''),
  OPENWA_SESSION_ID: z.string().default('placement-buddy'),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  ✗ ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`\n❌ Environment validation failed:\n${formatted}\n`);
  }

  return Object.freeze(parsed.data);
}

export const env: Env = validateEnv();
