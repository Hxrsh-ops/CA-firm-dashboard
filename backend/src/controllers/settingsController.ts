import { Request, Response, NextFunction } from 'express';
import { getUnitOfWork } from '../repositories/index.js';
import { SettingsService } from '../services/settingsService.js';
import { updateSettingSchema } from '../schemas/validation.js';

export class SettingsController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const uow = getUnitOfWork();
      const service = new SettingsService(uow);
      const settings = await service.getAllSettings(req.firm_id);
      res.json({ data: settings });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateSettingSchema.parse(req.body);
      const uow = getUnitOfWork();
      const service = new SettingsService(uow);
      
      const updated = await service.updateSetting(
        req.firm_id,
        req.params.key,
        parsed.setting_value,
        parsed.updated_by || req.user_identity || 'CA Partner'
      );

      if (!updated) {
        res.status(404).json({
          error: {
            code: 'SETTING_NOT_FOUND',
            message: `Setting with key "${req.params.key}" not found.`
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
