/**
 * Drive routes — maps HTTP verbs to controller methods.
 */

import { Router } from 'express';
import { driveController } from '../controllers/drive.controller';
import { asyncHandler } from '../utils/async-handler';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin, isOpenDriveOnly } from '../middleware/authorize.middleware';

const router = Router();

router.get('/', authenticate, isOpenDriveOnly, asyncHandler(driveController.list));
router.get('/:id', authenticate, isOpenDriveOnly, asyncHandler(driveController.getById));
router.post('/', authenticate, isAdmin, asyncHandler(driveController.create));
router.patch('/:id', authenticate, isAdmin, asyncHandler(driveController.update));
router.delete('/:id', authenticate, isAdmin, asyncHandler(driveController.delete));

export const driveRoutes = router;
