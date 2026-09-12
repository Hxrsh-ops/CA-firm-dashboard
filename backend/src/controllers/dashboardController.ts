import { Request, Response, NextFunction } from 'express';
import { getUnitOfWork } from '../repositories/index.js';
import { DashboardService } from '../services/dashboardService.js';

export class DashboardController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const uow = getUnitOfWork();
      const service = new DashboardService(uow);
      const period = (req.query.period as string) || '2026-08';
      const data = await service.getDashboardData(req.firm_id, period);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
}
