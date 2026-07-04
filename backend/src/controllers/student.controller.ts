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
import { StudentModel } from '../models';
import { AppError } from '../middleware/error-handler';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

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

  async getMe(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED');
    }

    const student = await StudentModel.findById(userId);
    if (!student) {
      throw new AppError('Student profile not found', StatusCodes.NOT_FOUND, 'NOT_FOUND');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: student,
    });
  },

  async updateMe(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED');
    }

    const updatedStudent = await StudentModel.findByIdAndUpdate(
      userId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      throw new AppError('Student profile not found', StatusCodes.NOT_FOUND, 'NOT_FOUND');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedStudent,
      message: 'Profile updated successfully',
    });
  },

  async uploadResume(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED');
    }

    if (!req.file) {
      throw new AppError('No file uploaded or file type is not PDF', StatusCodes.BAD_REQUEST, 'BAD_REQUEST');
    }

    // Check Cloudinary config is present
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      throw new AppError(
        'Cloudinary credentials are not configured on the backend server.',
        StatusCodes.BAD_REQUEST,
        'CLOUDINARY_NOT_CONFIGURED'
      );
    }

    // Setup Cloudinary config
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });

    // Upload buffer to Cloudinary
    let secureUrl: string;
    try {
      secureUrl = await new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'resumes',
            resource_type: 'raw',
            public_id: `resume_${userId}_${Date.now()}`,
            format: 'pdf',
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result!.secure_url);
          }
        );
        uploadStream.end(req.file!.buffer);
      });
    } catch (err: any) {
      throw new AppError(`Cloudinary upload failed: ${err.message}`, StatusCodes.INTERNAL_SERVER_ERROR, 'UPLOAD_FAILED');
    }

    // Save URL to student in DB
    const updatedStudent = await StudentModel.findByIdAndUpdate(
      userId,
      { resume_url: secureUrl },
      { new: true }
    );

    if (!updatedStudent) {
      throw new AppError('Student profile not found', StatusCodes.NOT_FOUND, 'NOT_FOUND');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: { resume_url: secureUrl },
      message: 'Resume uploaded successfully',
    });
  },
};
