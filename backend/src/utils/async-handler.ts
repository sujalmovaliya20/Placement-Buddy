/**
 * Async route handler wrapper — eliminates try/catch boilerplate in controllers.
 *
 * Wraps an async Express handler so that any rejected promise is automatically
 * forwarded to the next() error handler instead of crashing the process.
 *
 * Usage:
 *   router.get('/', asyncHandler(controller.list));
 */

import type { Request, Response, NextFunction } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export function asyncHandler(fn: AsyncRequestHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
