/**
 * Express application setup — middleware stack, routes, error handling.
 *
 * This module creates and configures the Express app but does NOT start
 * the server. The server.ts module handles bootstrapping and listening.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import compression from 'compression';
import { env } from './config/env';
import { API_PREFIX } from './config/constants';
import { apiRouter } from './routes';
import { notFoundHandler } from './middleware/not-found';
import { globalErrorHandler } from './middleware/error-handler';
import { apiRateLimiter } from './middleware/rate-limiter';
import cookieParser from 'cookie-parser';
import { whatsappService } from './services/whatsapp.service';

export function createApp(): express.Application {
  const app = express();

  // Trust proxy for rate limiting (e.g. behind Nginx, Cloudflare)
  app.set('trust proxy', 1);

  // ── Security ──────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          sandbox: ['allow-forms', 'allow-scripts'],
        },
      },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      frameguard: {
        action: 'deny',
      },
      crossOriginResourcePolicy: { policy: 'same-origin' },
    }),
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) {
          callback(null, true);
          return;
        }

        if (env.NODE_ENV === 'production') {
          // Strict in production: only allow the exact configured production frontend URL
          if (origin === env.FRONTEND_URL) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS in production'));
          }
        } else {
          // Dev/Test mode: allow the configured FRONTEND_URL, local developer instances, or any localhost port
          const allowedOrigins = [env.FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'];
          const isAllowed = allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
          callback(null, isAllowed);
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }),
  );

  // ── Rate Limiting ─────────────────────────────────────────
  app.use(apiRateLimiter);

  // ── Response Compression ──────────────────────────────────
  app.use(compression());

  // ── Body & Cookie parsing ─────────────────────────────────
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── Request logging ───────────────────────────────────────
  if (env.NODE_ENV !== 'test') {
    app.use(
      morgan('short', {
        stream: {
          write: (message: string) => {
            process.stdout.write(message);
          },
        },
      }),
    );
  }

  // ── Health check ──────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    const isConnected = mongoose.connection.readyState === 1;
    if (!isConnected) {
      res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Database is disconnected',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        db: 'connected',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
      },
    });
  });

  // ── WhatsApp status check ──────────────────────────────────
  app.get('/api/whatsapp/status', (_req, res) => {
    const connected = whatsappService.isServiceConnected();
    res.status(200).json({
      success: true,
      connected,
    });
  });

  // ── Security.txt ──────────────────────────────────────────
  app.get('/.well-known/security.txt', (_req, res) => {
    res.type('text/plain').send(
      `Contact: mailto:security@${env.COLLEGE_EMAIL_DOMAIN}\nExpires: 2027-07-06T12:00:00.000Z\nPreferred-Languages: en\n`
    );
  });
  app.get('/security.txt', (_req, res) => {
    res.redirect('/.well-known/security.txt');
  });

  // ── API routes ────────────────────────────────────────────
  app.use(API_PREFIX, apiRouter);

  // ── Error handling (must be LAST) ─────────────────────────
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
