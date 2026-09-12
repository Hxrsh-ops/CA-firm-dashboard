import { Request, Response, NextFunction } from 'express';
import { getUnitOfWork } from '../repositories/index.js';
import { AlertService } from '../services/alertService.js';
import { updateAlertSchema } from '../schemas/validation.js';

export class AlertController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const uow = getUnitOfWork();
      const service = new AlertService(uow);
      const alerts = await service.getAllAlerts(req.firm_id);
      res.json({ data: alerts });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateAlertSchema.parse(req.body);
      const uow = getUnitOfWork();
      const service = new AlertService(uow);
      
      const updated = await service.updateAlertStatus(
        req.firm_id,
        req.params.id,
        parsed.status,
        parsed.updated_by || req.user_identity || 'CA Partner',
        parsed.notes
      );

      if (!updated) {
        res.status(404).json({
          error: {
            code: 'ALERT_NOT_FOUND',
            message: `Alert with ID ${req.params.id} not found.`
          }
        });
        return;
      }

      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
}
