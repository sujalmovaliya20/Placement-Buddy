/**
 * Server bootstrap — validates env, starts listening, handles graceful shutdown.
 *
 * This is the application entry point. Run with: tsx src/server.ts
 */

import './config/validateEnv';
import { env } from './config/env';
import { createApp } from './app';
import { logger } from './utils/logger';
import { connectDatabase, closeDatabase } from './config/db';
import { whatsappService } from './services/whatsapp.service';

async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB Atlas first
    await connectDatabase();

    // Initialize WhatsApp service client
    await whatsappService.initialize();

    const app = createApp();
    const port = env.PORT;

    const server = app.listen(port, () => {
      logger.info(
        { port, env: env.NODE_ENV },
        `🚀 Server running at http://localhost:${port}`,
      );
      logger.info(`📡 API available at http://localhost:${port}/api/v1`);
      logger.info(`💚 Health check at http://localhost:${port}/api/health`);
    });

    // ── Graceful shutdown ───────────────────────────────────────
    const shutdown = async (signal: string): Promise<void> => {
      logger.info({ signal }, 'Shutdown signal received, closing server...');

      // Close Express server
      server.close(async () => {
        logger.info('HTTP server closed');
        // Shutdown WhatsApp client cleanly
        await whatsappService.shutdown();
        // Close DB connection
        await closeDatabase();
        process.exit(0);
      });

      // Force shutdown after 10 seconds if connections don't close
      setTimeout(() => {
        logger.error('Forced shutdown — connections did not close in time');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => {
      shutdown('SIGTERM').catch((err) => {
        logger.error({ err }, 'Error during SIGTERM shutdown');
        process.exit(1);
      });
    });

    process.on('SIGINT', () => {
      shutdown('SIGINT').catch((err) => {
        logger.error({ err }, 'Error during SIGINT shutdown');
        process.exit(1);
      });
    });

  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }

  // ── Unhandled rejection / exception safety net ──────────────
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });

  process.on('uncaughtException', (error: Error) => {
    logger.fatal({ err: error }, 'Uncaught exception — shutting down');
    process.exit(1);
  });
}

startServer();
