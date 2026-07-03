/**
 * Drive routes — maps HTTP verbs to controller methods.
 */

import { Router } from 'express';
import { driveController } from '../controllers/drive.controller';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.get('/', asyncHandler(driveController.list));
router.get('/:id', asyncHandler(driveController.getById));
router.post('/', asyncHandler(driveController.create));
router.patch('/:id', asyncHandler(driveController.update));
router.delete('/:id', asyncHandler(driveController.delete));

export const driveRoutes = router;
