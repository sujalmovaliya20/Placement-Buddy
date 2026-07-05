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
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        const allowedOrigins = [env.CORS_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'];
        const isAllowed = allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        callback(null, isAllowed);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }),
  );

  // ── Rate Limiting ─────────────────────────────────────────
  app.use(apiRateLimiter);

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

  // ── API routes ────────────────────────────────────────────
  app.use(API_PREFIX, apiRouter);

  // ── Error handling (must be LAST) ─────────────────────────
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
