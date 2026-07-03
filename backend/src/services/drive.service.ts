/**
 * Drive service — business logic for placement drive operations.
 *
 * Handles CRUD, eligibility checks, and status transitions for drives.
 */

import type {
  Drive,
  CreateDrivePayload,
  UpdateDrivePayload,
} from '../models';
import type { ListQueryParams, PaginatedResponse } from '../../../shared/src/types/api';
import { AppError } from '../middleware/error-handler';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger';
import { PAGINATION } from '../config/constants';

const drives: Map<string, Drive> = new Map();

function generateId(): string {
  return `drv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const driveService = {
  async list(query: ListQueryParams): Promise<PaginatedResponse<Drive>> {
    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

    let items = Array.from(drives.values());

    if (query.search) {
      const term = query.search.toLowerCase();
      items = items.filter(
        (d) =>
          d.company_name.toLowerCase().includes(term) ||
          d.role.toLowerCase().includes(term),
      );
    }

    if (query.sortBy) {
      const sortKey = query.sortBy as keyof Drive;
      const order = query.sortOrder === 'desc' ? -1 : 1;
      items.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal) * order;
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * order;
        }
        return 0;
      });
    }

    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = items.slice(start, start + limit);

    return {
      success: true,
      data,
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
    const drive = drives.get(id);

    if (!drive) {
      throw new AppError(`Drive with ID "${id}" not found`, StatusCodes.NOT_FOUND);
    }

    return drive;
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

    const now = new Date();
    const drive = {
      id: generateId(),
      ...payload,
      createdAt: now,
      updatedAt: now,
    } as unknown as Drive;

    drives.set(drive.id, drive);
    logger.info({ driveId: drive.id, company: drive.company_name }, 'Drive created');

    return drive;
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

    const updated = {
      ...existing,
      ...payload,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    } as unknown as Drive;

    drives.set(id, updated);
    logger.info({ driveId: id }, 'Drive updated');

    return updated;
  },

  async delete(id: string): Promise<void> {
    const drive = drives.get(id);

    if (!drive) {
      throw new AppError(`Drive with ID "${id}" not found`, StatusCodes.NOT_FOUND);
    }

    if (drive.status === 'in_progress') {
      throw new AppError(
        'Cannot delete a drive that is currently in progress',
        StatusCodes.CONFLICT,
        'DRIVE_IN_PROGRESS',
      );
    }

    drives.delete(id);
    logger.info({ driveId: id }, 'Drive deleted');
  },
};
