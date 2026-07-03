/**
 * API router — aggregates all resource routes under /api/v1.
 */

import { Router } from 'express';
import { studentRoutes } from './student.routes';
import { driveRoutes } from './drive.routes';
import { applicationRoutes } from './application.routes';

const router = Router();

router.use('/students', studentRoutes);
router.use('/drives', driveRoutes);
router.use('/applications', applicationRoutes);

export const apiRouter = router;
