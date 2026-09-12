import { Request, Response, NextFunction } from 'express';
import { getUnitOfWork } from '../repositories/index.js';
import { ComplianceEngine } from '../services/complianceEngine.js';

export class ComplianceController {
  static async getCompliance(req: Request, res: Response, next: NextFunction) {
    try {
      const uow = getUnitOfWork();
      const service = new ComplianceEngine(uow);
      const period = (req.query.period as string) || '2026-08';
      const result = await service.evaluateCompliance(req.firm_id, period);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}
