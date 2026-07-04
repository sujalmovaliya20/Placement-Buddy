/**
 * Drive service — business logic for placement drive operations.
 *
 * Handles CRUD, eligibility checks, and status transitions for drives.
 */

import type { Drive } from '../models';
import { DriveModel } from '../models';
import type { CreateDrivePayload, UpdateDrivePayload } from '../models';
import type { ListQueryParams, PaginatedResponse } from '../../../shared/src/types/api';
import { AppError } from '../middleware/error-handler';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger';
import { PAGINATION } from '../config/constants';

export const driveService = {
  async list(query: ListQueryParams & { status?: string }): Promise<PaginatedResponse<Drive>> {
    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const search = query.search;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
    const filter: Record<string, any> = {};

    // ROOT CAUSE: Previously, the controller/service ignored the status parameter, resulting in a leak
    // of drafts/closed drives to students (who only had client-side post-filtering on the dashboard).
    // This also caused page count/pagination bugs due to client-side filtering.
    // FIX: Extracted and enforced the status filter directly in the MongoDB query.
    if (query.status) {
      filter.status = query.status;
    }

    if (search) {
      filter.$or = [
        { company_name: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await DriveModel.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;

    const data = await DriveModel.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(start)
      .limit(limit);

    return {
      success: true,
      data: data as unknown as Drive[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  },

  async getById(id: string): Promise<Drive> {
    const drive = await DriveModel.findById(id);

    if (!drive) {
      throw new AppError(`Drive with ID "${id}" not found`, StatusCodes.NOT_FOUND);
    }

    return drive as unknown as Drive;
  },

  async create(payload: CreateDrivePayload): Promise<Drive> {
    // Validate deadline is in the future
    if (new Date(payload.deadline) <= new Date()) {
      throw new AppError(
        'Application deadline must be in the future',
        StatusCodes.BAD_REQUEST,
        'INVALID_DEADLINE',
      );
    }

    const drive = await DriveModel.create(payload);
    logger.info({ driveId: drive._id, company: drive.company_name }, 'Drive created');

    return drive as unknown as Drive;
  },

  async update(id: string, payload: UpdateDrivePayload): Promise<Drive> {
    const existing = await this.getById(id);

    // Prevent editing completed/cancelled drives
    if (existing.status === 'completed' || existing.status === 'cancelled') {
      throw new AppError(
        `Cannot update a drive with status "${existing.status}"`,
        StatusCodes.CONFLICT,
        'DRIVE_FINALIZED',
      );
    }

    const updated = await DriveModel.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw new AppError(`Drive with ID "${id}" not found`, StatusCodes.NOT_FOUND);
    }

    logger.info({ driveId: id }, 'Drive updated');
    return updated as unknown as Drive;
  },

  async delete(id: string): Promise<void> {
    const drive = await this.getById(id);

    if (drive.status === 'in_progress') {
      throw new AppError(
        'Cannot delete a drive that is currently in progress',
        StatusCodes.CONFLICT,
        'DRIVE_IN_PROGRESS',
      );
    }

    await DriveModel.findByIdAndDelete(id);
    logger.info({ driveId: id }, 'Drive deleted');
  },
};
