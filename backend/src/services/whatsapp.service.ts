import { logger } from '../utils/logger';
import { buildDriveMessage } from '../config/whatsappTemplates';
import type { Drive } from '../models';
import { env } from '../config/env';

export const whatsappService = {
  /**
   * Initializes the WhatsApp service.
   * For REST-based OpenWA, no local browser process needs to be booted.
   */
  async initialize(): Promise<void> {
    logger.info('WhatsApp service initialized (using OpenWA API Gateway)...');
    if (!env.OPENWA_API_KEY) {
      logger.warn('OPENWA_API_KEY is not configured. WhatsApp notifications will fail.');
    }
  },

  /**
   * Checks if the WhatsApp session is connected on the OpenWA gateway.
   */
  async isServiceConnected(): Promise<boolean> {
    const url = `${env.OPENWA_API_URL}/api/sessions/${env.OPENWA_SESSION_ID}`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-Key': env.OPENWA_API_KEY,
        },
      });

      if (!res.ok) {
        logger.error(`OpenWA session check returned status ${res.status}`);
        return false;
      }

      const data = await res.json() as any;
      // OpenWA session endpoint returns session info. Let's read status/state.
      const status = data?.status || data?.data?.status || data?.state || data?.data?.state;
      return status === 'CONNECTED' || status === 'connected';
    } catch (error) {
      logger.error({ err: error }, 'Failed to connect to OpenWA API Gateway for status check');
      return false;
    }
  },

  /**
   * Sends a drive notification message to the specified WhatsApp group.
   * Retries once if the initial send fails.
   */
  async sendDriveNotification(groupId: string, drive: Drive, retryCount = 1): Promise<void> {
    const message = buildDriveMessage(drive);
    const url = `${env.OPENWA_API_URL}/api/sessions/${env.OPENWA_SESSION_ID}/messages/send-text`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': env.OPENWA_API_KEY,
        },
        body: JSON.stringify({
          chatId: groupId,
          text: message,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenWA API error (${res.status}): ${errText}`);
      }

      logger.info(
        { driveId: drive._id, groupId },
        'Drive notification sent successfully via OpenWA API'
      );
    } catch (error) {
      logger.error(
        { error, driveId: drive._id, groupId, retryCount },
        'Error sending WhatsApp notification via OpenWA API'
      );

      if (retryCount > 0) {
        logger.info('Retrying WhatsApp notification send...');
        return this.sendDriveNotification(groupId, drive, retryCount - 1);
      }
      throw error;
    }
  },

  /**
   * Graceful shutdown (no-op since we don't hold a local browser instance).
   */
  async shutdown(): Promise<void> {
    logger.info('WhatsApp service shutdown (no local client to close).');
  },
};
