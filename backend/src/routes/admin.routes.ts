import { Router } from 'express';
import { adminDriveController } from '../controllers/admin-drive.controller';
import { googleAuthController } from '../controllers/google-auth.controller';
import { asyncHandler } from '../utils/async-handler';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/authorize.middleware';
import { oauthCallbackRateLimiter } from '../middleware/rate-limiter';
import { validate } from '../middleware/validate';
import {
  createDriveSchema,
  listQuerySchema,
  parseGoogleFormSchema,
  parseFormStructureSchema,
  parsePrefillReferenceSchema,
  updateMappingSchema,
} from '@shared/index';

const router = Router();

// OAuth callback route must be publicly accessible (authenticated via state token)
router.get('/google-auth/callback', oauthCallbackRateLimiter, asyncHandler(googleAuthController.callback));

// Apply admin authentication to all routes below
router.use(authenticate, isAdmin);

// Google OAuth connect/disconnect routes
router.get('/google-auth/connect', asyncHandler(googleAuthController.connect));
router.delete('/google-auth/disconnect', asyncHandler(googleAuthController.disconnect));

// Drives management
router.post('/drives', validate({ body: createDriveSchema }), asyncHandler(adminDriveController.create));
router.get('/drives', validate({ query: listQuerySchema }), asyncHandler(adminDriveController.list));
router.post('/drives/:id/parse-google-form', validate({ body: parseGoogleFormSchema }), asyncHandler(adminDriveController.parseGoogleForm));
router.post('/drives/:id/parse-form-structure', validate({ body: parseFormStructureSchema }), asyncHandler(adminDriveController.parseFormStructure));
router.post('/drives/:id/parse-prefill-reference', validate({ body: parsePrefillReferenceSchema }), asyncHandler(adminDriveController.parsePrefillReference));
router.put('/drives/:id/mapping', validate({ body: updateMappingSchema }), asyncHandler(adminDriveController.updateMapping));
router.get('/drives/:id/applications', asyncHandler(adminDriveController.getApplications));
router.get('/drives/:id/export', asyncHandler(adminDriveController.exportApplicationsCsv));
router.post('/drives/:id/notify', asyncHandler(adminDriveController.notify));

export const adminRoutes = router;

