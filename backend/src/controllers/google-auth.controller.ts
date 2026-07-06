import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AdminModel } from '../models';
import { oauth2Client } from '../services/googleAuth.service';
import { encrypt, decrypt } from '../utils/encryption';
import { AppError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

export const googleAuthController = {
  /**
   * Generates the Google OAuth consent URL.
   * Signs the admin ID inside the state parameter to verify in the callback.
   */
  async connect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED);
      }

      // Generate a secure state token containing the adminId
      const stateToken = jwt.sign({ adminId }, env.JWT_SECRET, { expiresIn: '15m' });

      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent', // Ensures refresh_token is always generated
        scope: ['https://www.googleapis.com/auth/forms.body.readonly'],
        state: stateToken,
      });

      res.status(StatusCodes.OK).json({
        success: true,
        data: { url },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Google OAuth Callback endpoint.
   * Public route (not token authenticated). Authenticates via state token.
   * Exchanges code for tokens, encrypts the refresh token, and updates Admin profile.
   */
  async callback(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(`${env.FRONTEND_URL}/admin/settings?error=${encodeURIComponent('Missing OAuth code or state parameter')}`);
    }

    try {
      // 1. Verify and decode state token
      let adminId: string;
      try {
        const decoded = jwt.verify(state as string, env.JWT_SECRET) as { adminId: string };
        adminId = decoded.adminId;
      } catch (err) {
        return res.redirect(`${env.FRONTEND_URL}/admin/settings?error=${encodeURIComponent('Invalid or expired state parameter. Please try again.')}`);
      }

      // 2. Exchange authorization code for access/refresh tokens
      const { tokens } = await oauth2Client.getToken(code as string);

      if (!tokens.refresh_token) {
        // If user already authorized, Google won't return refresh token unless prompted.
        // We force prompt='consent' in generateAuthUrl, but just in case:
        logger.error({ adminId }, 'Google OAuth callback succeeded but no refresh token returned');
        return res.redirect(
          `${env.FRONTEND_URL}/admin/settings?error=${encodeURIComponent(
            'Google did not return a refresh token. Please go to your Google Account permissions, remove Placement Buddy, and try again.'
          )}`
        );
      }

      // 3. Encrypt refresh token
      const encryptedRefreshToken = encrypt(tokens.refresh_token);

      // 4. Update Admin Document
      await AdminModel.findByIdAndUpdate(adminId, {
        $set: {
          google_refresh_token: encryptedRefreshToken,
          google_connected: true,
          google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        },
      });

      logger.info({ adminId }, 'Admin successfully connected Google OAuth account');
      
      // Redirect back to admin settings with success parameter
      res.redirect(`${env.FRONTEND_URL}/admin/settings?success=google_connected`);
    } catch (error: any) {
      logger.error({ err: error }, 'Google OAuth callback flow failed');
      res.redirect(`${env.FRONTEND_URL}/admin/settings?error=${encodeURIComponent(error.message || 'Google Auth flow failed')}`);
    }
  },

  /**
   * Disconnects Google integration.
   * Revokes credentials at Google and wipes database settings.
   */
  async disconnect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED);
      }

      const admin = await AdminModel.findById(adminId).select('+google_refresh_token');
      if (!admin) {
        throw new AppError('Admin not found', StatusCodes.NOT_FOUND);
      }

      // 1. If we have a refresh token, attempt to revoke it at Google
      if (admin.google_refresh_token) {
        try {
          const decryptedToken = decrypt(admin.google_refresh_token);
          await oauth2Client.revokeToken(decryptedToken);
        } catch (revokeError: any) {
          // Log but continue disconnecting locally even if Google revoke fails
          logger.warn({ err: revokeError, adminId }, 'Failed to revoke Google token during disconnect');
        }
      }

      // 2. Wipe DB settings
      await AdminModel.findByIdAndUpdate(adminId, {
        $set: {
          google_refresh_token: null,
          google_connected: false,
          google_token_expiry: null,
        },
      });

      logger.info({ adminId }, 'Admin disconnected Google OAuth integration');

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Google Account disconnected successfully.',
      });
    } catch (error) {
      next(error);
    }
  },
};
