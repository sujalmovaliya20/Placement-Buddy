import { Router } from 'express';
import { adminDriveController } from '../controllers/admin-drive.controller';
import { asyncHandler } from '../utils/async-handler';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/authorize.middleware';

const router = Router();

// Apply admin authentication to all routes under /admin
router.use(authenticate, isAdmin);

// Drives management
router.post('/drives', asyncHandler(adminDriveController.create));
router.get('/drives', asyncHandler(adminDriveController.list));
router.post('/drives/:id/parse-google-form', asyncHandler(adminDriveController.parseGoogleForm));
router.put('/drives/:id/mapping', asyncHandler(adminDriveController.updateMapping));
router.get('/drives/:id/applications', asyncHandler(adminDriveController.getApplications));
router.get('/drives/:id/export', asyncHandler(adminDriveController.exportApplicationsCsv));
router.post('/drives/:id/notify', asyncHandler(adminDriveController.notify));

export const adminRoutes = router;
