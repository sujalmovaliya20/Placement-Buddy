/**
 * 404 handler — catches all requests that didn't match any route.
 *
 * Must be registered AFTER all routes and BEFORE the global error handler.
 */

import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}
