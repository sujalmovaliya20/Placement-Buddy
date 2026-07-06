import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

export async function connectDatabase(): Promise<void> {
  let attempt = 1;

  const options: mongoose.ConnectOptions = {
    maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
  };

  while (attempt <= MAX_RETRIES) {
    try {
      logger.info(`Connecting to MongoDB Atlas (Attempt ${attempt}/${MAX_RETRIES})...`);
      await mongoose.connect(env.MONGODB_URI, options);
      logger.info('Successfully connected to MongoDB Atlas.');
      return;
    } catch (error) {
      logger.error({ error }, `Failed to connect to MongoDB on attempt ${attempt}`);
      attempt++;
      if (attempt <= MAX_RETRIES) {
        logger.info(`Retrying in ${RETRY_INTERVAL_MS / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
      }
    }
  }

  throw new Error('Database connection failed after maximum retries');
}

// Graceful shutdown handler
export async function closeDatabase(): Promise<void> {
  try {
    logger.info('Closing MongoDB connection...');
    await mongoose.connection.close();
    logger.info('MongoDB connection closed cleanly.');
  } catch (error) {
    logger.error({ error }, 'Error while closing MongoDB connection');
  }
}
