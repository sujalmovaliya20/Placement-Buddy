/**
 * Student controller — orchestrates HTTP request/response for student endpoints.
 *
 * Controllers parse requests, call services, and format responses.
 * They never contain business logic or database calls.
 */

import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { studentService } from '../services/student.service';
import type { ListQueryParams } from '../../../shared/src/types/api';
import type { CreateStudentPayload, UpdateStudentPayload } from '../models';

export const studentController = {
  async list(req: Request, res: Response): Promise<void> {
    const query: ListQueryParams = {
      page: req.query['page'] ? Number(req.query['page']) : undefined,
      limit: req.query['limit'] ? Number(req.query['limit']) : undefined,
      sortBy: req.query['sortBy'] as string | undefined,
      sortOrder: req.query['sortOrder'] as 'asc' | 'desc' | undefined,
      search: req.query['search'] as string | undefined,
    };

    const result = await studentService.list(query);
    res.status(StatusCodes.OK).json(result);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const student = await studentService.getById(req.params['id'] as string);

    res.status(StatusCodes.OK).json({
      success: true,
      data: student,
    });
  },

  async create(req: Request, res: Response): Promise<void> {
    const payload = req.body as CreateStudentPayload;
    const student = await studentService.create(payload);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: student,
      message: 'Student created successfully',
    });
  },

  async update(req: Request, res: Response): Promise<void> {
    const payload = req.body as UpdateStudentPayload;
    const student = await studentService.update(req.params['id'] as string, payload);

    res.status(StatusCodes.OK).json({
      success: true,
      data: student,
      message: 'Student updated successfully',
    });
  },

  async delete(req: Request, res: Response): Promise<void> {
    await studentService.delete(req.params['id'] as string);

    res.status(StatusCodes.NO_CONTENT).send();
  },
};
