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

export function createApp(): express.Application {
  const app = express();

  // ── Security ──────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }),
  );

  // ── Rate Limiting ─────────────────────────────────────────
  app.use(apiRateLimiter);

  // ── Body parsing ──────────────────────────────────────────
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

  // ── API routes ────────────────────────────────────────────
  app.use(API_PREFIX, apiRouter);

  // ── Error handling (must be LAST) ─────────────────────────
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
