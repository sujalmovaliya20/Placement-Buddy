/**
 * ROOT CAUSE: This service layer previously stored, listed, and updated student profiles in an
 * in-memory Map structure. Consequently, restarting the server cleared the map, losing all active
 * student listings and details even though they still existed in MongoDB.
 * FIX: Refactored the service layer to perform direct Mongoose queries against the StudentModel.
 */

import mongoose from 'mongoose';
import type {
  Student,
  CreateStudentPayload,
  UpdateStudentPayload,
} from '../models';
import { StudentModel } from '../models';
import type { ListQueryParams, PaginatedResponse } from '../../../shared/src/types/api';
import { AppError } from '../middleware/error-handler';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger';
import { PAGINATION } from '../config/constants';

export const studentService = {
  async list(query: ListQueryParams): Promise<PaginatedResponse<Student>> {
    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const search = query.search;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder === 'desc' ? -1 : 1;

    const filter: any = {};

    if (search) {
      const regex = { $regex: search, $options: 'i' };
      filter.$or = [
        { first_name: regex },
        { last_name: regex },
        { email: regex },
        { enrollment_number: regex },
      ];
    }

    const total = await StudentModel.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;

    const data = await StudentModel.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(start)
      .limit(limit);

    return {
      success: true,
      data: data as unknown as Student[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  },

  async getById(id: string): Promise<Student> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(`Invalid Student ID format: "${id}"`, StatusCodes.BAD_REQUEST, 'INVALID_ID');
    }

    const student = await StudentModel.findById(id);

    if (!student) {
      throw new AppError(`Student with ID "${id}" not found`, StatusCodes.NOT_FOUND, 'NOT_FOUND');
    }

    return student as unknown as Student;
  },

  async create(payload: CreateStudentPayload): Promise<Student> {
    // Check for duplicate email
    const existingEmail = await StudentModel.findOne({ email: payload.email });
    if (existingEmail) {
      throw new AppError(
        `A student with email "${payload.email}" already exists`,
        StatusCodes.CONFLICT,
        'DUPLICATE_EMAIL',
      );
    }

    // Check for duplicate enrollment number
    const existingEnrollment = await StudentModel.findOne({ enrollment_number: payload.enrollment_number });
    if (existingEnrollment) {
      throw new AppError(
        `A student with enrollment number "${payload.enrollment_number}" already exists`,
        StatusCodes.CONFLICT,
        'DUPLICATE_ENROLLMENT_NO',
      );
    }

    try {
      const student = await StudentModel.create(payload);
      logger.info({ studentId: student._id }, 'Student created successfully in DB');
      return student as unknown as Student;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new AppError(
          'Email or Roll Number already exists',
          StatusCodes.CONFLICT,
          'DUPLICATE_RECORD'
        );
      }
      throw error;
    }
  },

  async update(id: string, payload: UpdateStudentPayload): Promise<Student> {
    const existing = await this.getById(id);

    // Check email uniqueness if email is being changed
    if (payload.email && payload.email !== existing.email) {
      const emailTaken = await StudentModel.findOne({ email: payload.email, _id: { $ne: id } });
      if (emailTaken) {
        throw new AppError(
          `A student with email "${payload.email}" already exists`,
          StatusCodes.CONFLICT,
          'DUPLICATE_EMAIL',
        );
      }
    }

    // Check enrollment number uniqueness if enrollment number is being changed
    if (payload.enrollment_number && payload.enrollment_number !== existing.enrollment_number) {
      const enrollmentTaken = await StudentModel.findOne({ enrollment_number: payload.enrollment_number, _id: { $ne: id } });
      if (enrollmentTaken) {
        throw new AppError(
          `A student with enrollment number "${payload.enrollment_number}" already exists`,
          StatusCodes.CONFLICT,
          'DUPLICATE_ENROLLMENT_NO',
        );
      }
    }

    const updated = await StudentModel.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw new AppError(`Student with ID "${id}" not found`, StatusCodes.NOT_FOUND, 'NOT_FOUND');
    }

    logger.info({ studentId: id }, 'Student updated in DB');
    return updated as unknown as Student;
  },

  async delete(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(`Invalid Student ID format: "${id}"`, StatusCodes.BAD_REQUEST, 'INVALID_ID');
    }

    const deleted = await StudentModel.findByIdAndDelete(id);

    if (!deleted) {
      throw new AppError(`Student with ID "${id}" not found`, StatusCodes.NOT_FOUND, 'NOT_FOUND');
    }

    logger.info({ studentId: id }, 'Student deleted from DB');
  },
};
