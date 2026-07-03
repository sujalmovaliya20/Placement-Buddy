/**
 * Application controller — orchestrates HTTP request/response for application endpoints.
 */

import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { applicationService } from '../services/application.service';
import type { ListQueryParams } from '../../../shared/src/types/api';
import type { CreateApplicationPayload, UpdateApplicationStatusPayload } from '../models';

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
    const application = await applicationService.create(payload);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: application,
      message: 'Application submitted successfully',
    });
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
    await applicationService.delete(req.params['id'] as string);

    res.status(StatusCodes.NO_CONTENT).send();
  },
};
