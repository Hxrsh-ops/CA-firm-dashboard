import { Request, Response, NextFunction } from 'express';
import { getUnitOfWork } from '../repositories/index.js';
import { AuditService } from '../services/auditService.js';

export class AuditLogController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const uow = getUnitOfWork();
      const service = new AuditService(uow);
      const logs = await service.getFirmLogs(req.firm_id);
      res.json({ data: logs });
    } catch (err) {
      next(err);
    }
  }
}
