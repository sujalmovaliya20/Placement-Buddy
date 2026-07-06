import { google } from 'googleapis';
import { env } from '../config/env';
import { AdminModel } from '../models';
import { decrypt } from '../utils/encryption';
import { AppError } from '../middleware/error-handler';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger';

export class GoogleNotConnectedError extends AppError {
  constructor() {
    super('Google Account is not connected. Please connect your Google account in settings.', StatusCodes.BAD_REQUEST, 'GOOGLE_NOT_CONNECTED');
  }
}

// Instantiate Google OAuth2 Client
export const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

export const googleAuthService = {
  /**
   * Retrieves and decrypts the refresh token for the specified admin,
   * then uses the OAuth2 client to refresh and return a valid access token.
   */
  async getValidAccessToken(adminId: string): Promise<string> {
    const admin = await AdminModel.findById(adminId).select('+google_refresh_token');
    if (!admin || !admin.google_connected || !admin.google_refresh_token) {
      throw new GoogleNotConnectedError();
    }

    try {
      const decryptedRefreshToken = decrypt(admin.google_refresh_token);
      
      // Setup the client with the refresh token
      oauth2Client.setCredentials({
        refresh_token: decryptedRefreshToken,
      });

      // Get fresh access token (refreshes automatically if expired)
      const tokenResponse = await oauth2Client.getAccessToken();
      const accessToken = tokenResponse.token;

      if (!accessToken) {
        throw new AppError('Failed to refresh Google access token', StatusCodes.INTERNAL_SERVER_ERROR);
      }

      return accessToken;
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(`Google auth credential refresh failed: ${err.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  },

  /**
   * Helper to extract the form ID from a Google Form URL.
   * Can handle /forms/d/e/1FAIpQL.../viewform and /forms/d/1Pqra.../edit styles.
   */
  extractFormId(url: string): string | null {
    const trimmed = url.trim();
    const match = trimmed.match(/\/forms\/d\/(?:e\/)?([a-zA-Z0-9_-]+)/);
    return match ? (match[1] ?? null) : null;
  },

  /**
   * Fetches form structure via the Google Forms API and parses it into fields.
   */
  async fetchFormFieldsViaApi(googleFormUrl: string, accessToken: string): Promise<Array<{ entryId: string; label: string; type: string }>> {
    const formId = this.extractFormId(googleFormUrl);
    if (!formId) {
      throw new AppError('Invalid Google Form URL structure. Unable to extract Form ID.', StatusCodes.BAD_REQUEST);
    }

    try {
      // Setup temporary auth for this request
      const client = new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        env.GOOGLE_REDIRECT_URI
      );
      client.setCredentials({ access_token: accessToken });

      const formsApi = google.forms({ version: 'v1', auth: client });
      const response = await formsApi.forms.get({ formId });

      const items = response.data.items || [];
      const fields: Array<{ entryId: string; label: string; type: string }> = [];

      for (const item of items) {
        if (item.questionItem && item.questionItem.question) {
          const question = item.questionItem.question;
          const label = item.title || '';
          const questionIdHex = question.questionId;
          if (!questionIdHex) continue;

          // Convert hex question ID to decimal to match prefill entry ID
          const decimalId = parseInt(questionIdHex, 16);
          const entryId = `entry.${decimalId}`;

          // Map Forms API question types to Placement Buddy types
          let type = 'text';
          if (question.textQuestion) {
            type = 'text';
          } else if (question.choiceQuestion) {
            const choiceType = question.choiceQuestion.type;
            if (choiceType === 'CHECKBOX') {
              type = 'checkbox';
            } else {
              type = 'select'; // DROPDOWN, RADIO, etc.
            }
          } else if (question.dateQuestion) {
            type = 'date';
          } else if (question.timeQuestion) {
            type = 'time';
          }

          fields.push({
            entryId,
            label,
            type,
          });
        }
      }

      return fields;
    } catch (err: any) {
      throw new AppError(`Google Forms API call failed: ${err.message}`, StatusCodes.BAD_REQUEST);
    }
  },

  /**
   * Fetches the form structure via the Google Forms API using the editor URL.
   * Returns question titles, hex itemIds, and types — for TPO display only,
   * NOT for prefill entry ID mapping (Forms API does not expose entry.* IDs).
   */
  async fetchFormStructureViaApi(editorUrl: string, accessToken: string): Promise<Array<{ title: string; itemId: string; type: string }>> {
    // Extract formId from /forms/d/FORM_ID/edit pattern
    const match = editorUrl.trim().match(/\/forms\/d\/([a-zA-Z0-9_-]+)\/edit/);
    if (!match || !match[1]) {
      throw new AppError(
        'Invalid editor URL — expected format: https://docs.google.com/forms/d/FORM_ID/edit',
        StatusCodes.BAD_REQUEST,
        'INVALID_EDITOR_URL'
      );
    }
    const formId = match[1];

    try {
      const client = new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        env.GOOGLE_REDIRECT_URI
      );
      client.setCredentials({ access_token: accessToken });

      const formsApi = google.forms({ version: 'v1', auth: client });
      const response = await formsApi.forms.get({ formId });

      const items = response.data.items || [];
      const structure: Array<{ title: string; itemId: string; type: string }> = [];

      for (const item of items) {
        if (item.questionItem && item.questionItem.question) {
          const question = item.questionItem.question;
          const title = item.title || '(Untitled Question)';
          const questionIdHex = question.questionId || '';

          let type = 'text';
          if (question.textQuestion) {
            type = 'text';
          } else if (question.choiceQuestion) {
            type = question.choiceQuestion.type === 'CHECKBOX' ? 'checkbox' : 'select';
          } else if (question.dateQuestion) {
            type = 'date';
          } else if (question.timeQuestion) {
            type = 'time';
          }

          structure.push({ title, itemId: questionIdHex, type });
        }
      }

      return structure;
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(`Google Forms API call failed: ${err.message}`, StatusCodes.BAD_REQUEST, 'FORMS_API_ERROR');
    }
  },

  /**
   * Fetches form items via the Google Forms API and returns only real question items
   * (i.e. items where item.questionItem is defined). Excludes textItem, imageItem,
   * videoItem, and pageBreakItem — these never produce entry.XXXXXXX prefill params.
   *
   * Also emits warnings for compound question types (date, time, scale, grid) since
   * those may need multiple entry IDs per question in edge cases.
   *
   * @returns { questionItems, skippedItems } where skippedItems is a list of
   * human-readable descriptions of the excluded items (for TPO visibility).
   */
  async fetchFormItemsFiltered(
    formId: string,
    accessToken: string
  ): Promise<{
    questionItems: Array<{ title: string; questionIdHex: string; type: string }>;
    skippedItems: string[];
  }> {
    const client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI
    );
    client.setCredentials({ access_token: accessToken });

    let items: any[];
    try {
      const formsApi = google.forms({ version: 'v1', auth: client });
      const response = await formsApi.forms.get({ formId });
      items = response.data.items || [];
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(`Google Forms API call failed: ${err.message}`, StatusCodes.BAD_REQUEST, 'FORMS_API_ERROR');
    }

    const questionItems: Array<{ title: string; questionIdHex: string; type: string }> = [];
    const skippedItems: string[] = [];

    for (const item of items) {
      const title: string = item.title || '(Untitled)';

      // CRITICAL: only include items that have a questionItem — skip all
      // structural/decorative item types (textItem, imageItem, videoItem, pageBreakItem).
      if (!item.questionItem) {
        let kind = 'unknown';
        if (item.textItem)      kind = 'textItem (section description)';
        else if (item.imageItem)     kind = 'imageItem';
        else if (item.videoItem)     kind = 'videoItem';
        else if (item.pageBreakItem) kind = 'pageBreakItem (section header)';
        const desc = `"${title}" [${kind}]`;
        skippedItems.push(desc);
        continue;
      }

      const question = item.questionItem.question;
      if (!question) continue;

      const questionIdHex: string = question.questionId || '';

      // Map type
      let type = 'text';
      if (question.textQuestion) {
        type = 'text';
      } else if (question.choiceQuestion) {
        type = question.choiceQuestion.type === 'CHECKBOX' ? 'checkbox' : 'select';
      } else if (question.dateQuestion) {
        type = 'date';
      } else if (question.timeQuestion) {
        type = 'time';
      } else if (question.scaleQuestion) {
        type = 'scale';
      } else if (question.rowQuestion) {
        type = 'row';
      }

      // Warn on compound types that may need multiple entry IDs per question.
      // For now we keep them in the 1:1 zip; full compound handling is YAGNI
      // until one is encountered in a real test form.
      if (question.dateQuestion || question.timeQuestion || question.scaleQuestion || question.rowQuestion) {
        logger.warn(
          { formId, questionTitle: title, type },
          'Compound question type detected, verify mapping manually'
        );
      }

      questionItems.push({ title, questionIdHex, type });
    }

    return { questionItems, skippedItems };
  },
};
