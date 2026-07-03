/**
 * Centralized error handling — AppError class + global error middleware.
 *
 * All service/controller errors should throw AppError (or be caught and
 * wrapped by the async handler). The global middleware at the bottom of
 * the Express stack catches everything and sends a consistent JSON response.
 */

import type { Request, Response, NextFunction } from 'express';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * Custom application error with HTTP status code and machine-readable error code.
 *
 * Throw this from services/controllers — the global middleware handles the rest.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    code?: string,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code ?? getReasonPhrase(statusCode).toUpperCase().replace(/\s+/g, '_');
    this.isOperational = true;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Format Zod validation errors into a structured error response.
 */
function formatZodError(error: ZodError): { message: string; field?: string } {
  const firstIssue = error.issues[0];
  if (!firstIssue) {
    return { message: 'Validation failed' };
  }

  const field = firstIssue.path.join('.');
  const message = field ? `${field}: ${firstIssue.message}` : firstIssue.message;

  return { message, field: field || undefined };
}

/**
 * Global error handling middleware — must be the LAST middleware registered.
 *
 * Express identifies error-handling middleware by its 4-parameter signature.
 */
export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors → 400
  if (err instanceof ZodError) {
    const { message, field } = formatZodError(err);
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
        field,
      },
    });
    return;
  }

  // Mongoose Validation Errors → 400
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((el) => el.message);
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Validation failed: ${messages.join(', ')}`,
      },
    });
    return;
  }

  // Mongoose Cast Errors (e.g. invalid ObjectIds) → 400
  if (err instanceof mongoose.Error.CastError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: {
        code: 'CAST_ERROR',
        message: `Invalid format for field "${err.path}": ${err.value}`,
      },
    });
    return;
  }

  // MongoDB duplicate key error (code 11000) → 409
  if ((err as any).code === 11000) {
    const keyValue = (err as any).keyValue || {};
    const field = Object.keys(keyValue)[0] || 'field';
    const value = keyValue[field] || '';
    res.status(StatusCodes.CONFLICT).json({
      success: false,
      error: {
        code: 'ALREADY_EXISTS',
        message: `A record with the same unique value for "${field}" (${value}) already exists.`,
      },
    });
    return;
  }

  // Known operational errors → use the status code from AppError
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err }, 'Non-operational AppError encountered');
    }

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // SyntaxError from body-parser (malformed JSON)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: {
        code: 'MALFORMED_JSON',
        message: 'Request body contains invalid JSON',
      },
    });
    return;
  }

  // Unexpected errors → 500, log full stack
  logger.error({ err, stack: err.stack }, 'Unhandled error');

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        process.env['NODE_ENV'] === 'production'
          ? 'An unexpected error occurred'
          : err.message,
    },
  });
}
