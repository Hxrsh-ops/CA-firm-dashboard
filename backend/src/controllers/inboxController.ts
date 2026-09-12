import { Request, Response, NextFunction } from 'express';
import { getUnitOfWork } from '../repositories/index.js';
import { DashboardService } from '../services/dashboardService.js';

export class InboxController {
  static async getInbox(req: Request, res: Response, next: NextFunction) {
    try {
      const uow = getUnitOfWork();
      const service = new DashboardService(uow);
      const tab = (req.query.tab as string) || 'all';
      const search = req.query.search as string;
      const data = await service.getInboxData(req.firm_id, tab, search);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
}
