import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DriveModel, ApplicationModel, NotificationLogModel } from '../models';
import { AppError } from '../middleware/error-handler';
import { googleAuthService } from '../services/googleAuth.service';
import { logger } from '../utils/logger';
import { whatsappService } from '../services/whatsapp.service';
import { buildDriveMessage } from '../config/whatsappTemplates';
import { env } from '../config/env';
import { PAGINATION } from '../config/constants';

/**
 * Helper to normalize Google Form URL to the public viewform format.
 */
export function normalizeGoogleFormUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(/^(https:\/\/docs\.google\.com\/forms\/d\/(?:e\/)?[a-zA-Z0-9_-]+)\/edit/);
  if (match && match[1]) {
    return `${match[1]}/viewform`;
  }
  return trimmed;
}

/**
 * Helper to fetch Google Form HTML and extract input field details using regex.
 */
async function fetchGoogleFormFields(url: string): Promise<Array<{ entryId: string; label: string; type: string }>> {
  let html: string;
  const normalizedUrl = normalizeGoogleFormUrl(url) || url;
  let finalUrl = normalizedUrl;
  try {
    const res = await fetch(normalizedUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    finalUrl = res.url;

    if (res.status === 401 || res.status === 403 || finalUrl.includes('accounts.google.com')) {
      throw new AppError('Form requires Google authentication.', StatusCodes.BAD_REQUEST, 'NEEDS_FORMS_API');
    }

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    html = await res.text();
  } catch (err: any) {
    if (err instanceof AppError && err.code === 'NEEDS_FORMS_API') {
      throw err;
    }
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
      'Could not parse Google Form. Falling back to Forms API.',
      StatusCodes.BAD_REQUEST,
      'NEEDS_FORMS_API'
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
    const page = req.query['page'] ? Number(req.query['page']) : PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      req.query['limit'] ? Number(req.query['limit']) : PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );
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
    const { googleFormUrl } = req.body;

    const updatePayload: any = {};
    if (googleFormUrl) {
      updatePayload.google_form_url = normalizeGoogleFormUrl(googleFormUrl);
    }

    let drive;
    if (Object.keys(updatePayload).length > 0) {
      drive = await DriveModel.findByIdAndUpdate(id, { $set: updatePayload }, { new: true });
    } else {
      drive = await DriveModel.findById(id);
    }

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

    try {
      const fields = await fetchGoogleFormFields(drive.google_form_url);
      res.status(StatusCodes.OK).json({
        success: true,
        data: fields,
      });
    } catch (err: any) {
      // Scrape failed (login-redirect detected or parse error).
      // Do NOT fall back to Forms API — that path uses internal itemIds, not prefill entry.* IDs.
      // Signal the frontend to switch to the editor-link + reference-link flow.
      logger.info(
        { driveId: id, errCode: err?.code },
        'Google Form public scrape failed — instructing admin to use editor-link flow'
      );
      res.status(StatusCodes.OK).json({
        success: false,
        error: {
          code: 'NEEDS_PREFILL_REFERENCE_LINK',
          message:
            'This form is restricted or login-protected. Provide the editor link so we can fetch the question list via Google Forms API.',
        },
      });
    }
  },

  /**
   * POST /api/admin/drives/:id/parse-form-structure
   * Accepts an editor URL, extracts the formId, calls the Google Forms API
   * using the admin's connected Google account, and returns the question list
   * (title + itemId hex + type) — for display purposes only.
   * Does NOT return prefill entry.* IDs (those come from the reference-link flow).
   */
  async parseFormStructure(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { editor_url } = req.body as { editor_url?: string };

    if (!editor_url || !editor_url.trim()) {
      throw new AppError('editor_url is required', StatusCodes.BAD_REQUEST, 'MISSING_EDITOR_URL');
    }

    const drive = await DriveModel.findById(id);
    if (!drive) {
      throw new AppError('Drive not found', StatusCodes.NOT_FOUND);
    }

    const adminId = req.user?.id;
    if (!adminId) {
      throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED);
    }

    let accessToken: string;
    try {
      accessToken = await googleAuthService.getValidAccessToken(adminId);
    } catch (err: any) {
      // GoogleNotConnectedError — surface as a structured response so UI can prompt connection
      if (err?.code === 'GOOGLE_NOT_CONNECTED') {
        res.status(StatusCodes.OK).json({
          success: false,
          error: {
            code: 'GOOGLE_NOT_CONNECTED',
            message: 'Your Google account is not connected. Connect it in Settings to use this feature.',
          },
        });
        return;
      }
      throw err;
    }

    const structure = await googleAuthService.fetchFormStructureViaApi(editor_url, accessToken);

    // Save editor_url to the drive document
    drive.google_form_editor_url = editor_url;
    await drive.save();

    logger.info({ adminId, driveId: id, questionCount: structure.length }, 'Fetched form structure via Google Forms API and saved editor_url');

    res.status(StatusCodes.OK).json({
      success: true,
      data: structure,
    });
  },

  /**
   * POST /api/admin/drives/:id/parse-prefill-reference
   *
   * Accepts a Google Form pre-filled reference link (from TPO: Preview → Get pre-filled link).
   * Parses entry.XXXXXXX=value params in order, fetches form structure via Forms API,
   * filters to question-only items (CRITICAL — excludes textItem/imageItem/videoItem/pageBreakItem),
   * zips them 1:1 by position, validates count match, and returns [{entryId, label, itemId}]
   * in the same shape the frontend FormField mapping UI already expects.
   */
  async parsePrefillReference(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { prefill_url } = req.body as { prefill_url?: string };

    if (!prefill_url || !prefill_url.trim()) {
      throw new AppError('prefill_url is required', StatusCodes.BAD_REQUEST, 'MISSING_PREFILL_URL');
    }

    const trimmedUrl = prefill_url.trim();
    if (!trimmedUrl.startsWith('https://docs.google.com/forms/')) {
      throw new AppError(
        'Invalid prefill URL — must be a Google Forms URL (https://docs.google.com/forms/...)',
        StatusCodes.BAD_REQUEST,
        'INVALID_PREFILL_URL'
      );
    }

    const drive = await DriveModel.findById(id);
    if (!drive) {
      throw new AppError('Drive not found', StatusCodes.NOT_FOUND);
    }

    const adminId = req.user?.id;
    if (!adminId) {
      throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED);
    }

    // 1. Extract entry.* params in order (URLSearchParams preserves insertion order), deduplicating them
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      throw new AppError('prefill_url is not a valid URL', StatusCodes.BAD_REQUEST, 'INVALID_PREFILL_URL');
    }

    const entryIds: string[] = [];
    parsedUrl.searchParams.forEach((_, key) => {
      if (key.startsWith('entry.')) {
        if (!entryIds.includes(key)) {
          entryIds.push(key);
        }
      }
    });

    if (entryIds.length === 0) {
      throw new AppError(
        'No entry.* parameters found in the prefill URL. Make sure you copy the URL from Google Forms → Preview → Get pre-filled link.',
        StatusCodes.BAD_REQUEST,
        'NO_ENTRY_PARAMS'
      );
    }

    // 2. Extract formId from stored google_form_editor_url on the Drive document
    let formId = '';
    if (drive.google_form_editor_url) {
      const match = drive.google_form_editor_url.trim().match(/\/forms\/d\/([a-zA-Z0-9_-]+)\/edit/);
      if (match && match[1]) {
        formId = match[1];
      }
    }

    if (!formId && drive.google_form_url) {
      const match = drive.google_form_url.trim().match(/\/forms\/d\/([a-zA-Z0-9_-]+)\/edit/);
      if (match && match[1]) {
        formId = match[1];
      }
    }

    if (!formId) {
      throw new AppError(
        'Form ID not found. Please verify the Editor Link in the previous step first.',
        StatusCodes.BAD_REQUEST,
        'MISSING_EDITOR_URL'
      );
    }

    // 3. Get valid access token
    let accessToken: string;
    try {
      accessToken = await googleAuthService.getValidAccessToken(adminId);
    } catch (err: any) {
      if (err?.code === 'GOOGLE_NOT_CONNECTED') {
        res.status(StatusCodes.OK).json({
          success: false,
          error: {
            code: 'GOOGLE_NOT_CONNECTED',
            message: 'Your Google account is not connected. Connect it in Settings to use this feature.',
          },
        });
        return;
      }
      throw err;
    }

    // 4. Fetch form items — filtered to question-only (CRITICAL)
    const { questionItems, skippedItems } = await googleAuthService.fetchFormItemsFiltered(formId, accessToken);

    if (skippedItems.length > 0) {
      logger.info(
        { driveId: id, skipped: skippedItems },
        'parse-prefill-reference: skipped non-question items'
      );
    }

    // 5. Validate count match
    if (questionItems.length !== entryIds.length) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: {
          code: 'COUNT_MISMATCH',
          message: `Question count (${questionItems.length}) does not match entry parameter count (${entryIds.length}). Form may have changed since reference link was generated, please regenerate.`,
        },
      });
      return;
    }

    // 6. Zip questions against entry IDs by position
    const mapped = questionItems.map((q, i) => ({
      entryId: entryIds[i]!,
      label: q.title,
      itemId: q.questionIdHex,
      type: q.type,
    }));

    logger.info(
      { adminId, driveId: id, mappedCount: mapped.length, skippedCount: skippedItems.length },
      'parse-prefill-reference: mapping generated successfully'
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: mapped,
      skipped: skippedItems,
    });
  },


  async updateMapping(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { field_mapping, manual_field_mapping } = req.body;

    if (field_mapping !== undefined && field_mapping !== null) {
      const invalidKeys: string[] = [];
      for (const [key, val] of Object.entries(field_mapping)) {
        const keyMatch = /^entry\.\d+$/.test(key);
        const valMatch = typeof val === 'string' && /^entry\.\d+$/.test(val);
        if (!keyMatch && !valMatch) {
          invalidKeys.push(key);
        }
      }
      if (invalidKeys.length > 0) {
        throw new AppError(
          `Invalid field_mapping keys: ${invalidKeys.join(', ')}. All keys must match entry.\\d+`,
          StatusCodes.BAD_REQUEST,
          'INVALID_ENTRY_KEY'
        );
      }
    }

    const updatePayload: any = {};
    if (field_mapping !== undefined) {
      updatePayload.field_mapping = field_mapping;
    }
    if (manual_field_mapping !== undefined) {
      updatePayload.manual_field_mapping = manual_field_mapping;
    }

    const drive = await DriveModel.findByIdAndUpdate(
      id,
      { $set: updatePayload },
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
    const standardHeaders = ['Enrollment No', 'First Name', 'Last Name', 'Course', 'CGPA (Prev Sem)', 'Contact Number', 'Email', 'Status', 'Applied At'];

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
        student?.enrollment_number ?? '',
        student?.first_name ?? '',
        student?.last_name ?? '',
        student?.course ?? '',
        student?.cgpa_previous_semester ?? '',
        student?.contact_number ?? '',
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
