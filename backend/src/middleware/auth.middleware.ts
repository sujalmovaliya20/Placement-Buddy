import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './error-handler';
import { StatusCodes } from 'http-status-codes';

export interface AuthUser {
  id: string; // Admin ID or Student ID
  email: string;
  role: 'student' | 'tpo' | 'superadmin';
}

// Extend Request type to include req.user and req.forcedStatus
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      forcedStatus?: string;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  let token = req.cookies?.['accessToken'];

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('No token provided. Please log in.', StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired token. Please log in.', StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED'));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  const user = req.user;
  if (!user) {
    return next(new AppError('Unauthorized. Please log in.', StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED'));
  }

  if (user.role !== 'tpo' && user.role !== 'superadmin') {
    return next(new AppError('Forbidden. Admin access required.', StatusCodes.FORBIDDEN, 'FORBIDDEN'));
  }

  next();
}

