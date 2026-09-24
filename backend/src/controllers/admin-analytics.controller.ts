import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { adminAnalyticsService } from '../services/admin-analytics.service';

export const adminAnalyticsController = {
  async getOverview(_req: Request, res: Response): Promise<void> {
    const analytics = await adminAnalyticsService.getOverview();
    res.status(StatusCodes.OK).json({
      success: true,
      data: analytics,
    });
  }
};
