/**
 * Application controller — orchestrates HTTP request/response for application endpoints.
 */

import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { applicationService } from '../services/application.service';
import type { ListQueryParams } from '../../../shared/src/types/api';
import type { CreateApplicationPayload, UpdateApplicationStatusPayload } from '../models';
import { AppError } from '../middleware/error-handler';

export const applicationController = {
  async list(req: Request, res: Response): Promise<void> {
    const query: ListQueryParams & { studentId?: string; driveId?: string } = {
      page: req.query['page'] ? Number(req.query['page']) : undefined,
      limit: req.query['limit'] ? Number(req.query['limit']) : undefined,
      sortBy: req.query['sortBy'] as string | undefined,
      sortOrder: req.query['sortOrder'] as 'asc' | 'desc' | undefined,
      search: req.query['search'] as string | undefined,
      studentId: req.query['studentId'] as string | undefined,
      driveId: req.query['driveId'] as string | undefined,
    };

    if (req.user && req.user.role === 'student') {
      query.studentId = req.user.id;
    }

    const result = await applicationService.list(query);
    res.status(StatusCodes.OK).json(result);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const application = await applicationService.getById(req.params['id'] as string);

    res.status(StatusCodes.OK).json({
      success: true,
      data: application,
    });
  },

  async create(req: Request, res: Response): Promise<void> {
    const payload = req.body as CreateApplicationPayload;

    if (!req.user) {
      throw new AppError('Unauthorized. Please log in.', StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED');
    }

    if (req.user.role !== 'tpo' && req.user.role !== 'superadmin' && req.user.id !== payload.student_id) {
      throw new AppError('Forbidden. You can only apply on your own behalf.', StatusCodes.FORBIDDEN, 'FORBIDDEN');
    }

    try {
      const application = await applicationService.create(payload);

      res.status(StatusCodes.CREATED).json({
        success: true,
        data: application,
        message: 'Application submitted successfully',
      });
    } catch (error: any) {
      if (error.code === 11000 || (error.name === 'MongoServerError' && error.code === 11000)) {
        throw new AppError(
          'You already applied to this drive',
          StatusCodes.CONFLICT,
          'ALREADY_APPLIED'
        );
      }
      throw error;
    }
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const payload = req.body as UpdateApplicationStatusPayload;
    const application = await applicationService.updateStatus(req.params['id'] as string, payload);

    res.status(StatusCodes.OK).json({
      success: true,
      data: application,
      message: `Application status updated to "${application.status}"`,
    });
  },

  async delete(req: Request, res: Response): Promise<void> {
    await applicationService.delete(req.params['id'] as string, req.user);

    res.status(StatusCodes.NO_CONTENT).send();
  },
};
