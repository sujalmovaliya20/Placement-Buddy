/**
 * Student service — business logic for student operations.
 *
 * This layer handles data access and business rules.
 * Controllers call services; services never send HTTP responses.
 */

import type {
  Student,
  CreateStudentPayload,
  UpdateStudentPayload,
} from '../models';
import type { ListQueryParams, PaginatedResponse } from '../../../shared/src/types/api';
import { AppError } from '../middleware/error-handler';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger';
import { PAGINATION } from '../config/constants';

/**
 * In-memory store — replace with your database adapter (Prisma, Mongoose, etc.)
 * This is a functional placeholder that demonstrates the service interface.
 */
const students: Map<string, Student> = new Map();

function generateId(): string {
  return `stu_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const studentService = {
  async list(query: ListQueryParams): Promise<PaginatedResponse<Student>> {
    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

    let items = Array.from(students.values());

    // Search filter
    if (query.search) {
      const term = query.search.toLowerCase();
      items = items.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term) ||
          s.roll_no.toLowerCase().includes(term),
      );
    }

    // Sort
    if (query.sortBy) {
      const sortKey = query.sortBy as keyof Student;
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

  async getById(id: string): Promise<Student> {
    const student = students.get(id);

    if (!student) {
      throw new AppError(`Student with ID "${id}" not found`, StatusCodes.NOT_FOUND);
    }

    return student;
  },

  async create(payload: CreateStudentPayload): Promise<Student> {
    // Check for duplicate email
    const existing = Array.from(students.values()).find((s) => s.email === payload.email);
    if (existing) {
      throw new AppError(
        `A student with email "${payload.email}" already exists`,
        StatusCodes.CONFLICT,
        'DUPLICATE_EMAIL',
      );
    }

    const now = new Date();
    const student = {
      id: generateId(),
      ...payload,
      createdAt: now,
      updatedAt: now,
    } as unknown as Student;

    students.set(student.id, student);
    logger.info({ studentId: student.id }, 'Student created');

    return student;
  },

  async update(id: string, payload: UpdateStudentPayload): Promise<Student> {
    const existing = await this.getById(id);

    // Check email uniqueness if email is being changed
    if (payload.email && payload.email !== existing.email) {
      const emailTaken = Array.from(students.values()).find(
        (s) => s.email === payload.email && s.id !== id,
      );
      if (emailTaken) {
        throw new AppError(
          `A student with email "${payload.email}" already exists`,
          StatusCodes.CONFLICT,
          'DUPLICATE_EMAIL',
        );
      }
    }

    const updated = {
      ...existing,
      ...payload,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    } as unknown as Student;

    students.set(id, updated);
    logger.info({ studentId: id }, 'Student updated');

    return updated;
  },

  async delete(id: string): Promise<void> {
    const exists = students.has(id);

    if (!exists) {
      throw new AppError(`Student with ID "${id}" not found`, StatusCodes.NOT_FOUND);
    }

    students.delete(id);
    logger.info({ studentId: id }, 'Student deleted');
  },
};
