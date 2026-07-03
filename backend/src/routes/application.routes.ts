/**
 * Application routes — maps HTTP verbs to controller methods.
 *
 * Note the PATCH /:id/status endpoint for status transitions
 * (separate from a general PATCH /:id update).
 */

import { Router } from 'express';
import { applicationController } from '../controllers/application.controller';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.get('/', asyncHandler(applicationController.list));
router.get('/:id', asyncHandler(applicationController.getById));
router.post('/', asyncHandler(applicationController.create));
router.patch('/:id/status', asyncHandler(applicationController.updateStatus));
router.delete('/:id', asyncHandler(applicationController.delete));

export const applicationRoutes = router;
