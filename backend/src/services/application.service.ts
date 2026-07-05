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
import { ApplicationModel, DriveModel, StudentModel } from '../models';
import type { ListQueryParams, PaginatedResponse } from '../../../shared/src/types/api';
import { AppError } from '../middleware/error-handler';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger';
import { PAGINATION } from '../config/constants';

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

    const filter: any = {};

    // Filter by student
    if (query.studentId) {
      filter.student_id = query.studentId;
    }

    // Filter by drive
    if (query.driveId) {
      filter.drive_id = query.driveId;
    }

    const total = await ApplicationModel.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;

    const data = await ApplicationModel.find(filter)
      .sort({ applied_at: -1 })
      .skip(start)
      .limit(limit);

    return {
      success: true,
      data: data as unknown as Application[],
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
    const application = await ApplicationModel.findById(id);

    if (!application) {
      throw new AppError(`Application with ID "${id}" not found`, StatusCodes.NOT_FOUND);
    }

    return application as unknown as Application;
  },

  async create(payload: CreateApplicationPayload): Promise<Application & { prefill_url?: string }> {
    // Check if the drive exists
    const drive = await DriveModel.findById(payload.drive_id);
    if (!drive) {
      throw new AppError('Drive not found', StatusCodes.NOT_FOUND);
    }

    // Check for duplicate application (same student + same drive)
    const duplicate = await ApplicationModel.findOne({
      student_id: payload.student_id,
      drive_id: payload.drive_id,
    });

    if (duplicate) {
      throw new AppError(
        'Student has already applied to this drive',
        StatusCodes.CONFLICT,
        'ALREADY_APPLIED',
      );
    }

    let prefillUrl: string | undefined;

    if (drive.source_type === 'google_form') {
      const student = await StudentModel.findById(payload.student_id);
      if (!student) {
        throw new AppError('Student profile not found', StatusCodes.NOT_FOUND);
      }

      // Build Google Form prefilled URL
      const baseFormUrl = (() => {
        const url = drive.google_form_url || '';
        const match = url.trim().match(/^(https:\/\/docs\.google\.com\/forms\/d\/(?:e\/)?[a-zA-Z0-9_-]+)\/edit/);
        if (match && match[1]) {
          return `${match[1]}/viewform`;
        }
        return url;
      })();
      prefillUrl = baseFormUrl;
      const params = new URLSearchParams();

      if (drive.field_mapping) {
        for (const [studentField, googleEntryId] of Object.entries(drive.field_mapping)) {
          let value: any;
          if (studentField.startsWith('links.')) {
            const linkKey = studentField.split('.')[1];
            if (linkKey) {
              value = student.links?.[linkKey];
            }
          } else {
            value = (student as any)[studentField];
          }

          if (value !== undefined && value !== null) {
            if (/^entry\.\d+$/.test(googleEntryId)) {
              params.append(googleEntryId, String(value));
            } else {
              logger.warn({ googleEntryId, studentField }, 'Skipped invalid googleEntryId pattern in prefill URL builder');
            }
          }
        }
      }

      const queryString = params.toString();
      if (queryString) {
        prefillUrl += (prefillUrl.includes('?') ? '&' : '?') + queryString;
      }
    }

    const application = await ApplicationModel.create({
      student_id: new mongoose.Types.ObjectId(payload.student_id),
      drive_id: new mongoose.Types.ObjectId(payload.drive_id),
      status: payload.status ?? 'applied',
      custom_answers: drive.source_type === 'native' ? (payload.custom_answers ?? {}) : {},
      applied_at: new Date(),
    });

    logger.info(
      {
        applicationId: application._id,
        studentId: payload.student_id,
        driveId: payload.drive_id,
        sourceType: drive.source_type
      },
      'Application submitted',
    );

    return {
      ...(application as any).toObject(),
      prefill_url: prefillUrl,
    };
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

    const updated = await ApplicationModel.findByIdAndUpdate(
      id,
      { $set: { status: payload.status } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw new AppError(`Application with ID "${id}" not found`, StatusCodes.NOT_FOUND);
    }

    logger.info(
      { applicationId: id, from: existing.status, to: payload.status },
      'Application status updated',
    );

    return updated as unknown as Application;
  },

  async delete(id: string, user?: { id: string; role: string }): Promise<void> {
    const application = await ApplicationModel.findById(id);
    if (!application) {
      throw new AppError(`Application with ID "${id}" not found`, StatusCodes.NOT_FOUND);
    }

    if (user && user.role !== 'tpo' && user.role !== 'superadmin') {
      const drive = await DriveModel.findById(application.drive_id);
      if (!drive) {
        throw new AppError('Drive associated with application not found', StatusCodes.NOT_FOUND);
      }
      if (drive.status !== 'open') {
        throw new AppError('Cannot withdraw application. Drive is no longer open.', StatusCodes.BAD_REQUEST);
      }
      if (new Date(drive.deadline) <= new Date()) {
        throw new AppError('Cannot withdraw application. The deadline has passed.', StatusCodes.BAD_REQUEST);
      }
    }

    await ApplicationModel.findByIdAndDelete(id);
    logger.info({ applicationId: id }, 'Application deleted');
  },
};
