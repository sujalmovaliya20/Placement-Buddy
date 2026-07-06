/**
 * Environment configuration validator — validates all env vars at startup using Zod.
 *
 * Fails fast with clear error messages and exits if any required variable is missing
 * or has an invalid format. Validated once and exported as a frozen object.
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI must be a valid connection string'),
  MONGODB_MAX_POOL_SIZE: z.coerce.number().int().positive().default(100),
  COLLEGE_EMAIL_DOMAIN: z.string().default('college.edu'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters in production')
    .default('dev-secret-change-me'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, 'JWT_REFRESH_SECRET must be at least 16 characters in production')
    .default('dev-refresh-secret-change-me'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
  CLOUDINARY_FOLDER: z.string().default('resumes_dev'),
  WHATSAPP_GROUP_ID: z.string().optional().default(''),
  OPENWA_API_URL: z.string().default('http://localhost:2785'),
  OPENWA_API_KEY: z.string().optional().default(''),
  OPENWA_SESSION_ID: z.string().default('placement-buddy'),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_REDIRECT_URI: z.string().default(''),
  GOOGLE_TOKEN_ENCRYPTION_KEY: z.string().default(''),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Strict CORS check for wildcard in production
  if (isProduction) {
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      console.error('\n❌ Production Configuration Error: FRONTEND_URL is required when NODE_ENV is production.\n');
      process.exit(1);
    }
    if (frontendUrl === '*' || frontendUrl.includes('*')) {
      console.error('\n❌ Production Configuration Error: Wildcard "*" or wildcard patterns are NOT allowed in FRONTEND_URL when NODE_ENV is production.\n');
      process.exit(1);
    }
  }

  // 2. Parse schema
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  ✗ ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error(`\n❌ Environment validation failed:\n${formatted}\n`);
    process.exit(1);
  }

  // Extra check to verify secrets are not default in production
  if (isProduction) {
    if (parsed.data.JWT_SECRET === 'dev-secret-change-me' || parsed.data.JWT_SECRET.length < 16) {
      console.error('\n❌ Security Error: JWT_SECRET must be customized and at least 16 characters in production.\n');
      process.exit(1);
    }
    if (parsed.data.JWT_REFRESH_SECRET === 'dev-refresh-secret-change-me' || parsed.data.JWT_REFRESH_SECRET.length < 16) {
      console.error('\n❌ Security Error: JWT_REFRESH_SECRET must be customized and at least 16 characters in production.\n');
      process.exit(1);
    }
  }

  return Object.freeze(parsed.data);
}

export const env: Env = validateEnv();
