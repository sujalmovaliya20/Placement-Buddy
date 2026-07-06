import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { StudentModel, AdminModel } from '../models';
import { AppError } from '../middleware/error-handler';
import { StatusCodes } from 'http-status-codes';

function generateTokens(user: { id: string; email: string; role: string }) {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const, // Use 'lax' for cross-subdomain cookie support in production
  maxAge,
});

export const authController = {
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = req.body;

      // Validate email domain matches COLLEGE_EMAIL_DOMAIN or gmail.com
      const email = payload.email.toLowerCase();
      if (!email.endsWith(`@${env.COLLEGE_EMAIL_DOMAIN}`) && !email.endsWith('@gmail.com')) {
        throw new AppError(
          `Email must end with @${env.COLLEGE_EMAIL_DOMAIN} or be a Gmail address (@gmail.com)`,
          StatusCodes.BAD_REQUEST,
          'INVALID_EMAIL_DOMAIN'
        );
      }

      // Check for duplicate student email
      const existingStudent = await StudentModel.findOne({ email: payload.email });
      if (existingStudent) {
        throw new AppError(
          'A student with this email already exists',
          StatusCodes.CONFLICT,
          'DUPLICATE_EMAIL'
        );
      }

      // Check for duplicate enrollment number
      const existingEnrollment = await StudentModel.findOne({ enrollment_number: payload.enrollment_number });
      if (existingEnrollment) {
        throw new AppError(
          'A student with this enrollment number already exists',
          StatusCodes.CONFLICT,
          'DUPLICATE_ENROLLMENT_NO'
        );
      }

      // Create student document (pre-save hook hashes password)
      const studentDoc = await StudentModel.create(payload);

      res.status(StatusCodes.CREATED).json({
        success: true,
        data: {
          id: studentDoc.id,
          name: studentDoc.name,
          email: studentDoc.email,
          role: 'student',
        },
        message: 'Registration successful',
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // 1. Check StudentModel
      let user = await StudentModel.findOne({ email }).select('+password');
      let role: 'student' | 'tpo' | 'superadmin' = 'student';

      if (!user) {
        // 2. Check AdminModel
        const admin = await AdminModel.findOne({ email }).select('+password');
        if (admin) {
          user = admin as any;
          role = admin.role;
        }
      }

      if (!user || !user.password) {
        throw new AppError('Invalid email or password', StatusCodes.UNAUTHORIZED, 'INVALID_CREDENTIALS');
      }

      // Validate password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new AppError('Invalid email or password', StatusCodes.UNAUTHORIZED, 'INVALID_CREDENTIALS');
      }

      // Generate credentials tokens
      const { accessToken, refreshToken } = generateTokens({
        id: user.id,
        email: user.email,
        role,
      });

      // Write tokens to HTTPOnly cookies
      res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000));
      res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role,
        },
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.['refreshToken'];
      if (!token) {
        throw new AppError('No refresh token provided', StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED');
      }

      try {
        const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as any;
        const { accessToken } = generateTokens({
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
        });

        res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000));
        res.status(StatusCodes.OK).json({
          success: true,
          message: 'Token refreshed successfully',
        });
      } catch (error) {
        throw new AppError('Invalid or expired refresh token', StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED');
      }
    } catch (error) {
      next(error);
    }
  },

  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie('accessToken', cookieOptions(0));
      res.clearCookie('refreshToken', cookieOptions(0));
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Not authenticated', StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED');
      }

      let userProfile;
      if (user.role === 'student') {
        userProfile = await StudentModel.findById(user.id);
      } else {
        userProfile = await AdminModel.findById(user.id);
      }

      if (!userProfile) {
        throw new AppError('User profile not found', StatusCodes.NOT_FOUND, 'NOT_FOUND');
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          id: userProfile.id,
          name: userProfile.name,
          email: userProfile.email,
          role: user.role,
          profile: userProfile,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

