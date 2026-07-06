import { Router } from 'express';
import { adminDriveController } from '../controllers/admin-drive.controller';
import { googleAuthController } from '../controllers/google-auth.controller';
import { asyncHandler } from '../utils/async-handler';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/authorize.middleware';
import { oauthCallbackRateLimiter } from '../middleware/rate-limiter';

const router = Router();

// OAuth callback route must be publicly accessible (authenticated via state token)
router.get('/google-auth/callback', oauthCallbackRateLimiter, asyncHandler(googleAuthController.callback));

// Apply admin authentication to all routes below
router.use(authenticate, isAdmin);

// Google OAuth connect/disconnect routes
router.get('/google-auth/connect', asyncHandler(googleAuthController.connect));
router.delete('/google-auth/disconnect', asyncHandler(googleAuthController.disconnect));

// Drives management
router.post('/drives', asyncHandler(adminDriveController.create));
router.get('/drives', asyncHandler(adminDriveController.list));
router.post('/drives/:id/parse-google-form', asyncHandler(adminDriveController.parseGoogleForm));
router.post('/drives/:id/parse-form-structure', asyncHandler(adminDriveController.parseFormStructure));
router.post('/drives/:id/parse-prefill-reference', asyncHandler(adminDriveController.parsePrefillReference));
router.put('/drives/:id/mapping', asyncHandler(adminDriveController.updateMapping));
router.get('/drives/:id/applications', asyncHandler(adminDriveController.getApplications));
router.get('/drives/:id/export', asyncHandler(adminDriveController.exportApplicationsCsv));
router.post('/drives/:id/notify', asyncHandler(adminDriveController.notify));

export const adminRoutes = router;

