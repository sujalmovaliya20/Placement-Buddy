/**
 * Application service — business logic for student applications to drives.
 *
 * Handles application submission, status transitions, and eligibility verification.
 */

import mongoose from 'mongoose';
import type {
  Application,
  CreateApplicationPayload,
  UpdateApplicationStatusPayload,
} from '../models';
import type { ListQueryParams, PaginatedResponse } from '../../../shared/src/types/api';
import { AppError } from '../middleware/error-handler';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger';
import { PAGINATION } from '../config/constants';

const applications: Map<string, Application> = new Map();

function generateId(): string {
  return `app_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Valid status transitions — guards against invalid state changes */
const VALID_TRANSITIONS: Record<string, string[]> = {
  applied: ['shortlisted', 'rejected'],
  shortlisted: ['rejected'],
  rejected: [],
};

export const applicationService = {
  async list(query: ListQueryParams & { studentId?: string; driveId?: string }): Promise<PaginatedResponse<Application>> {
    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

    let items = Array.from(applications.values());

    // Filter by student
    if (query.studentId) {
      items = items.filter((a) => a.student_id.toString() === query.studentId);
    }

    // Filter by drive
    if (query.driveId) {
      items = items.filter((a) => a.drive_id.toString() === query.driveId);
    }

    // Sort by applied_at descending by default
    items.sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());

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

  async getById(id: string): Promise<Application> {
    const application = applications.get(id);

    if (!application) {
      throw new AppError(`Application with ID "${id}" not found`, StatusCodes.NOT_FOUND);
    }

    return application;
  },

  async create(payload: CreateApplicationPayload): Promise<Application> {
    // Check for duplicate application (same student + same drive)
    const duplicate = Array.from(applications.values()).find(
      (a) =>
        a.student_id.toString() === payload.student_id &&
        a.drive_id.toString() === payload.drive_id &&
        a.status !== 'rejected',
    );

    if (duplicate) {
      throw new AppError(
        'Student has already applied to this drive',
        StatusCodes.CONFLICT,
        'DUPLICATE_APPLICATION',
      );
    }

    const application = {
      _id: new mongoose.Types.ObjectId(),
      id: generateId(),
      student_id: new mongoose.Types.ObjectId(payload.student_id),
      drive_id: new mongoose.Types.ObjectId(payload.drive_id),
      status: 'applied',
      applied_at: new Date(),
      custom_answers: payload.custom_answers ?? {},
    } as unknown as Application;

    applications.set(application.id, application);
    logger.info(
      { applicationId: application.id, studentId: payload.student_id, driveId: payload.drive_id },
      'Application submitted',
    );

    return application;
  },

  async updateStatus(id: string, payload: UpdateApplicationStatusPayload): Promise<Application> {
    const existing = await this.getById(id);

    // Validate status transition
    const allowed = VALID_TRANSITIONS[existing.status];
    if (!allowed || !allowed.includes(payload.status)) {
      throw new AppError(
        `Cannot transition from "${existing.status}" to "${payload.status}"`,
        StatusCodes.CONFLICT,
        'INVALID_STATUS_TRANSITION',
      );
    }

    const updated = {
      ...existing,
      status: payload.status,
    } as unknown as Application;

    applications.set(id, updated);
    logger.info(
      { applicationId: id, from: existing.status, to: payload.status },
      'Application status updated',
    );

    return updated;
  },

  async delete(id: string): Promise<void> {
    const exists = applications.has(id);

    if (!exists) {
      throw new AppError(`Application with ID "${id}" not found`, StatusCodes.NOT_FOUND);
    }

    applications.delete(id);
    logger.info({ applicationId: id }, 'Application deleted');
  },
};
