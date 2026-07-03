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

// Extend Request type to include req.user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No token provided. Please log in.', StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new AppError('Malformed token. Please log in.', StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired token. Please log in.', StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED'));
  }
}
