import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth.middleware';
import { loginRateLimiter } from '../middleware/rate-limiter';
import { signupSchema, loginSchema } from '@shared/index';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.post('/signup', validate({ body: signupSchema }), asyncHandler(authController.signup));
router.post('/login', loginRateLimiter, validate({ body: loginSchema }), asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.me));

export const authRoutes = router;
