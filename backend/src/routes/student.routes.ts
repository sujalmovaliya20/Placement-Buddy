/**
 * Student routes — maps HTTP verbs to controller methods.
 *
 * Routes only call controllers. Validation middleware runs before the controller.
 */

import { Router } from 'express';
import { studentController } from '../controllers/student.controller';
import { asyncHandler } from '../utils/async-handler';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { signupSchema, updateProfileSchema, listQuerySchema } from '@shared/index';
import { isAdmin, isOwner } from '../middleware/authorize.middleware';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed') as any);
    }
    cb(null, true);
  },
});

const router = Router();

// Profile CRUD operations (must be mounted before /:id)
router.get('/me', authenticate, asyncHandler(studentController.getMe));
router.put('/me', authenticate, validate({ body: updateProfileSchema }), asyncHandler(studentController.updateMe));
router.post('/me/resume', authenticate, upload.single('resume'), asyncHandler(studentController.uploadResume));

// General administrative operations
router.get('/', authenticate, isAdmin, validate({ query: listQuerySchema }), asyncHandler(studentController.list));
router.get('/:id', authenticate, isOwner('student'), asyncHandler(studentController.getById));
router.post('/', authenticate, isAdmin, validate({ body: signupSchema }), asyncHandler(studentController.create));
router.patch('/:id', authenticate, isOwner('student'), validate({ body: updateProfileSchema.partial() }), asyncHandler(studentController.update));
router.delete('/:id', authenticate, isAdmin, asyncHandler(studentController.delete));

export const studentRoutes = router;
