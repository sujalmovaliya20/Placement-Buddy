import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DriveModel, ApplicationModel, NotificationLogModel } from '../models';
import { AppError } from '../middleware/error-handler';
import { logger } from '../utils/logger';
import { whatsappService } from '../services/whatsapp.service';
import { buildDriveMessage } from '../config/whatsappTemplates';
import { env } from '../config/env';

/**
 * Helper to fetch Google Form HTML and extract input field details using regex.
 */
async function fetchGoogleFormFields(url: string): Promise<Array<{ entryId: string; label: string; type: string }>> {
  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    html = await res.text();
  } catch (err: any) {
    throw new AppError(
      'Failed to fetch the Google Form. Please verify that the URL is public and correct.',
      StatusCodes.BAD_REQUEST,
      'FORM_FETCH_FAILED'
    );
  }

  const match = /FB_PUBLIC_LOAD_DATA_\s*=\s*([\s\S]*?);/s.exec(html);
  const formJsonString = match?.[1];
  if (!match || !formJsonString) {
    throw new AppError(
      'Could not parse Google Form. Ensure the form is public and not restricted to your organization.',
      StatusCodes.BAD_REQUEST,
      'FORM_NOT_PUBLIC'
    );
  }

  try {
    const rawData = JSON.parse(formJsonString.trim());
    
    // Structure of FB_PUBLIC_LOAD_DATA_: rawData[1][1] contains form items
    if (!rawData || !Array.isArray(rawData) || rawData.length < 2 || !rawData[1]) {
      throw new AppError('Google Form structure is invalid or not public.', StatusCodes.BAD_REQUEST, 'INVALID_FORM_STRUCTURE');
    }
    
    const items = rawData[1][1];
    if (!Array.isArray(items)) {
      return [];
    }

    const fields: Array<{ entryId: string; label: string; type: string }> = [];

    for (const item of items) {
      if (!Array.isArray(item) || item.length < 4) continue;
      
      const label = item[1];
      const typeCode = item[3];
      const subQuestions = item[4];

      if (!subQuestions || !Array.isArray(subQuestions) || subQuestions.length === 0) continue;
      const subQuestion = subQuestions[0];
      if (!subQuestion || !Array.isArray(subQuestion) || subQuestion.length === 0) continue;
      
      const entryIdNum = subQuestion[0];
      if (!entryIdNum) continue;

      // Map question types
      let type = 'text';
      if (typeCode === 0 || typeCode === 1) type = 'text';
      else if (typeCode === 2 || typeCode === 3) type = 'select';
      else if (typeCode === 4) type = 'checkbox';
      else if (typeCode === 9) type = 'date';
      else if (typeCode === 10) type = 'time';

      fields.push({
        entryId: `entry.${entryIdNum}`,
        label,
        type,
      });
    }

    return fields;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      'Failed to parse Google Form metadata structure.',
      StatusCodes.BAD_REQUEST,
      'FORM_PARSE_FAILED'
    );
  }
}

export const adminDriveController = {
  async create(req: Request, res: Response): Promise<void> {
    if (new Date(req.body.deadline) <= new Date()) {
      throw new AppError(
        'Application deadline must be in the future',
        StatusCodes.BAD_REQUEST,
        'INVALID_DEADLINE',
      );
    }

    const payload = {
      ...req.body,
      created_by: req.user?.id,
    };

    const drive = await DriveModel.create(payload);
    logger.info({ driveId: drive._id, company: drive.company_name }, 'Drive created by Admin');

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: drive,
      message: 'Drive created successfully',
    });
  },

  async list(req: Request, res: Response): Promise<void> {
    const page = req.query['page'] ? Number(req.query['page']) : 1;
    const limit = req.query['limit'] ? Number(req.query['limit']) : 20;
    const search = req.query['search'] as string | undefined;
    const sortBy = req.query['sortBy'] as string ?? 'createdAt';
    const sortOrder = req.query['sortOrder'] === 'desc' ? -1 : 1;

    const filter: any = {};
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

    res.status(StatusCodes.OK).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  },

  async parseGoogleForm(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const drive = await DriveModel.findById(id);
    if (!drive) {
      throw new AppError('Drive not found', StatusCodes.NOT_FOUND);
    }

    if (drive.source_type !== 'google_form' || !drive.google_form_url) {
      throw new AppError(
        'This drive is not configured to use a Google Form or has no URL set.',
        StatusCodes.BAD_REQUEST,
        'NOT_GOOGLE_FORM_DRIVE'
      );
    }

    const fields = await fetchGoogleFormFields(drive.google_form_url);

    res.status(StatusCodes.OK).json({
      success: true,
      data: fields,
    });
  },

  async updateMapping(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const mapping = req.body.field_mapping !== undefined ? req.body.field_mapping : req.body;

    const drive = await DriveModel.findByIdAndUpdate(
      id,
      { $set: { field_mapping: mapping } },
      { new: true, runValidators: true }
    );

    if (!drive) {
      throw new AppError('Drive not found', StatusCodes.NOT_FOUND);
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: drive,
      message: 'Field mapping updated successfully',
    });
  },

  async getApplications(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const drive = await DriveModel.findById(id);
    if (!drive) {
      throw new AppError('Drive not found', StatusCodes.NOT_FOUND);
    }

    const applications = await ApplicationModel.find({ drive_id: id })
      .populate('student_id');

    res.status(StatusCodes.OK).json({
      success: true,
      data: applications,
    });
  },

  async exportApplicationsCsv(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const drive = await DriveModel.findById(id);
    if (!drive) {
      throw new AppError('Drive not found', StatusCodes.NOT_FOUND);
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=applications_${drive.company_name.replace(/\s+/g, '_')}_${id}.csv`);

    // Standard headers
    const standardHeaders = ['Roll No', 'Name', 'Branch', 'CGPA', 'Phone', 'Email', 'Status', 'Applied At'];
    
    // Custom fields headers
    const customFields = drive.custom_fields || [];
    const customHeaders = customFields.map(cf => cf.label);
    
    const headers = [...standardHeaders, ...customHeaders];
    res.write(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n');

    // Use cursor to stream rows one by one
    const cursor = ApplicationModel.find({ drive_id: id })
      .populate('student_id')
      .cursor();

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      const student = doc.student_id as any;
      
      const standardValues = [
        student?.roll_no ?? '',
        student?.name ?? '',
        student?.branch ?? '',
        student?.cgpa ?? '',
        student?.phone ?? '',
        student?.email ?? '',
        doc.status,
        doc.applied_at ? new Date(doc.applied_at).toISOString() : '',
      ];

      const customValues = customFields.map(cf => {
        const val = doc.custom_answers?.[cf.key];
        if (val === undefined || val === null) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      });

      const row = [...standardValues, ...customValues]
        .map(val => `"${String(val).replace(/"/g, '""')}"`)
        .join(',');

      res.write(row + '\n');
    }

    res.end();
  },

  async notify(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const drive = await DriveModel.findById(id);
    if (!drive) {
      throw new AppError('Drive not found', StatusCodes.NOT_FOUND);
    }

    const groupId = process.env['WHATSAPP_GROUP_ID'] || env.WHATSAPP_GROUP_ID;
    if (!groupId) {
      throw new AppError(
        'WHATSAPP_GROUP_ID is not configured in environment variables.',
        StatusCodes.BAD_REQUEST,
        'WHATSAPP_GROUP_ID_MISSING'
      );
    }

    const message = buildDriveMessage(drive as any);

    try {
      await whatsappService.sendDriveNotification(groupId, drive as any);

      // Log success to database
      await NotificationLogModel.create({
        drive_id: drive._id,
        group_id: groupId,
        message,
        status: 'sent',
      });

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Notification sent successfully via WhatsApp',
      });
    } catch (err: any) {
      logger.error(err, 'Failed to send WhatsApp notification');

      // Log failure to database (gracefully, don't crash request)
      await NotificationLogModel.create({
        drive_id: drive._id,
        group_id: groupId,
        message,
        status: 'failed',
        error_message: err.message || String(err),
      });

      res.status(StatusCodes.OK).json({
        success: false,
        message: 'WhatsApp notification failed but log was saved',
        error: err.message || String(err),
      });
    }
  },
};
