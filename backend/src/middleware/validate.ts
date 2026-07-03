/**
 * Zod-based request validation middleware.
 *
 * Validates req.body, req.params, and/or req.query against a Zod schema.
 * Invalid requests are rejected with a 400 before reaching the controller.
 */

import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

/**
 * Creates a validation middleware from Zod schemas.
 *
 * Usage in routes:
 *   router.post('/', validate({ body: createStudentSchema }), controller.create);
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body) as Record<string, unknown>;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Record<string, string>;
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Record<string, string>;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
