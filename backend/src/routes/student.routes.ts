/**
 * Student routes — maps HTTP verbs to controller methods.
 *
 * Routes only call controllers. Validation middleware runs before the controller.
 */

import { Router } from 'express';
import { studentController } from '../controllers/student.controller';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.get('/', asyncHandler(studentController.list));
router.get('/:id', asyncHandler(studentController.getById));
router.post('/', asyncHandler(studentController.create));
router.patch('/:id', asyncHandler(studentController.update));
router.delete('/:id', asyncHandler(studentController.delete));

export const studentRoutes = router;
