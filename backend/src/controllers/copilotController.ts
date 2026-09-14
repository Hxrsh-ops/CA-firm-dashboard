import { Request, Response, NextFunction } from 'express';
import { getUnitOfWork } from '../repositories/index.js';
import { CopilotService } from '../services/ai/copilotService.js';
import { ApiResponse } from '../types/api.js';

export class CopilotController {
  static async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const firm_id = req.firm_id;
      const { message, period } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Missing required field: message (string)'
          }
        });
      }

      const uow = getUnitOfWork();
      const copilotService = new CopilotService(uow);

      const result = await copilotService.processQuery(firm_id, message, period);

      return res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}
