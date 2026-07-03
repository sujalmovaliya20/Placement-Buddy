import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from './error-handler';
import { ApplicationModel, DriveModel } from '../models';

/**
 * Middleware to restrict route access to Admin roles (tpo, superadmin).
 */
export function isAdmin(req: Request, _res: Response, next: NextFunction): void {
  const user = req.user;
  if (!user) {
    return next(new AppError('Unauthorized. Please log in.', StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED'));
  }

  if (user.role !== 'tpo' && user.role !== 'superadmin') {
    return next(new AppError('Forbidden. Admin access required.', StatusCodes.FORBIDDEN, 'FORBIDDEN'));
  }

  next();
}

/**
 * Middleware to verify resource ownership.
 * Admins bypass this check. Students are restricted to accessing their own data.
 *
 * @param resourceType The type of resource to verify ownership on (student profile or application).
 */
export function isOwner(resourceType: 'student' | 'application') {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return next(new AppError('Unauthorized. Please log in.', StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED'));
    }

    // Admins bypass ownership checks
    if (user.role === 'tpo' || user.role === 'superadmin') {
      return next();
    }

    const id = req.params['id'];
    if (!id) {
      return next(new AppError('Resource ID is required', StatusCodes.BAD_REQUEST, 'BAD_REQUEST'));
    }

    if (resourceType === 'student') {
      // Students can only access/edit their own student profile doc
      if (user.id !== id) {
        return next(
          new AppError('Forbidden. You can only read or write your own profile.', StatusCodes.FORBIDDEN, 'FORBIDDEN')
        );
      }
      return next();
    }

    if (resourceType === 'application') {
      try {
        const application = await ApplicationModel.findById(id);
        if (!application) {
          return next(new AppError('Application not found', StatusCodes.NOT_FOUND, 'NOT_FOUND'));
        }

        // Students can only access their own application docs
        if (application.student_id.toString() !== user.id) {
          return next(
            new AppError('Forbidden. You can only read your own applications.', StatusCodes.FORBIDDEN, 'FORBIDDEN')
          );
        }
        return next();
      } catch (error) {
        return next(error);
      }
    }

    return next(new AppError('Invalid resource type for authorization', StatusCodes.INTERNAL_SERVER_ERROR, 'INTERNAL_SERVER_ERROR'));
  };
}

/**
 * Middleware to restrict students to only viewing Open drives.
 * For drive lists, it programmatically injects the open filter.
 * For single drive reads, it verifies the status and rejects non-open drives.
 */
export async function isOpenDriveOnly(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const user = req.user;
  if (!user) {
    return next(new AppError('Unauthorized. Please log in.', StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED'));
  }

  // Admins are allowed to read drafts or closed drives
  if (user.role === 'tpo' || user.role === 'superadmin') {
    return next();
  }

  const driveId = req.params['id'];
  if (driveId) {
    try {
      const drive = await DriveModel.findById(driveId);
      if (!drive) {
        return next(new AppError('Drive not found', StatusCodes.NOT_FOUND, 'NOT_FOUND'));
      }

      if (drive.status !== 'open') {
        return next(
          new AppError('Forbidden. You can only view open placement drives.', StatusCodes.FORBIDDEN, 'FORBIDDEN')
        );
      }
      return next();
    } catch (error) {
      return next(error);
    }
  } else {
    // Inject filter for query lists
    req.query['status'] = 'open';
    return next();
  }
}
