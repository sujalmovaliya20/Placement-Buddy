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

const router = Router();

router.get('/', authenticate, asyncHandler(applicationController.list));
router.get('/:id', authenticate, isOwner('application'), asyncHandler(applicationController.getById));
router.post('/', authenticate, asyncHandler(applicationController.create));
router.patch('/:id/status', authenticate, isAdmin, asyncHandler(applicationController.updateStatus));
router.delete('/:id', authenticate, isAdmin, asyncHandler(applicationController.delete));

export const applicationRoutes = router;
