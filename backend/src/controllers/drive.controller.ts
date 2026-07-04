/**
 * Drive controller — orchestrates HTTP request/response for drive endpoints.
 */

import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { driveService } from '../services/drive.service';
import type { ListQueryParams } from '../../../shared/src/types/api';
import type { CreateDrivePayload, UpdateDrivePayload } from '../models';

export const driveController = {
  async list(req: Request, res: Response): Promise<void> {
    const query: ListQueryParams & { status?: string } = {
      page: req.query['page'] ? Number(req.query['page']) : undefined,
      limit: req.query['limit'] ? Number(req.query['limit']) : undefined,
      sortBy: req.query['sortBy'] as string | undefined,
      sortOrder: req.query['sortOrder'] as 'asc' | 'desc' | undefined,
      search: req.query['search'] as string | undefined,
      status: req.forcedStatus || (req.query['status'] as string | undefined),
    };

    const result = await driveService.list(query);
    res.status(StatusCodes.OK).json(result);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const drive = await driveService.getById(req.params['id'] as string);

    res.status(StatusCodes.OK).json({
      success: true,
      data: drive,
    });
  },

  async create(req: Request, res: Response): Promise<void> {
    const payload = req.body as CreateDrivePayload;
    const drive = await driveService.create(payload);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: drive,
      message: 'Drive created successfully',
    });
  },

  async update(req: Request, res: Response): Promise<void> {
    const payload = req.body as UpdateDrivePayload;
    const drive = await driveService.update(req.params['id'] as string, payload);

    res.status(StatusCodes.OK).json({
      success: true,
      data: drive,
      message: 'Drive updated successfully',
    });
  },

  async delete(req: Request, res: Response): Promise<void> {
    await driveService.delete(req.params['id'] as string);

    res.status(StatusCodes.NO_CONTENT).send();
  },
};
