/**
 * Application routes — maps HTTP verbs to controller methods.
 *
 * Note the PATCH /:id/status endpoint for status transitions
 * (separate from a general PATCH /:id update).
 */

import { Router } from 'express';
import { applicationController } from '../controllers/application.controller';
import { asyncHandler } from '../utils/async-handler';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin, isOwner } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate';
import { createApplicationSchema, updateApplicationStatusSchema, listQuerySchema } from '@shared/index';

const router = Router();

router.get('/', authenticate, validate({ query: listQuerySchema }), asyncHandler(applicationController.list));
router.get('/:id', authenticate, isOwner('application'), asyncHandler(applicationController.getById));
router.post('/', authenticate, validate({ body: createApplicationSchema }), asyncHandler(applicationController.create));
router.patch('/:id/status', authenticate, isAdmin, validate({ body: updateApplicationStatusSchema }), asyncHandler(applicationController.updateStatus));
router.delete('/:id', authenticate, isOwner('application'), asyncHandler(applicationController.delete));

export const applicationRoutes = router;
