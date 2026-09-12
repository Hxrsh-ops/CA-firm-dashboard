import { Request, Response, NextFunction } from 'express';
import { getUnitOfWork } from '../repositories/index.js';
import { ReminderService } from '../services/reminderService.js';
import { 
  createReminderSchema, 
  updateReminderSchema, 
  approveReminderSchema 
} from '../schemas/validation.js';
import { DocumentType } from '../types/domain.js';

export class ReminderController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const uow = getUnitOfWork();
      const service = new ReminderService(uow);
      const reminders = await service.getAllReminders(req.firm_id);
      res.json({ data: reminders });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const uow = getUnitOfWork();
      const service = new ReminderService(uow);
      const reminder = await service.getReminderById(req.firm_id, req.params.id);
      if (!reminder) {
        res.status(404).json({
          error: {
            code: 'REMINDER_NOT_FOUND',
            message: `Reminder with ID ${req.params.id} not found.`
          }
        });
        return;
      }
      res.json({ data: reminder });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createReminderSchema.parse(req.body);
      const uow = getUnitOfWork();
      const service = new ReminderService(uow);

      const reminder = await service.createReminder({
        firm_id: req.firm_id,
        client_id: parsed.client_id,
        document_type: parsed.document_type as DocumentType,
        period: parsed.period,
        recipient_email: parsed.recipient_email,
        subject: parsed.subject,
        body: parsed.body,
        initial_status: 'Pending Approval',
        user: req.user_identity || 'CA Partner'
      });

      res.status(201).json({ data: reminder });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateReminderSchema.parse(req.body);
      const uow = getUnitOfWork();
      const service = new ReminderService(uow);

      const updated = await service.updateReminder(
        req.firm_id,
        req.params.id,
        parsed,
        req.user_identity || 'CA Partner'
      );

      if (!updated) {
        res.status(404).json({
          error: {
            code: 'REMINDER_NOT_FOUND',
            message: `Reminder with ID ${req.params.id} not found.`
          }
        });
        return;
      }

      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = approveReminderSchema.safeParse(req.body);
      const approvedBy = parsed.success ? parsed.data.approved_by : (req.user_identity || 'CA Partner');
      
      const uow = getUnitOfWork();
      const service = new ReminderService(uow);

      const updated = await service.approveReminder(req.firm_id, req.params.id, approvedBy);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async send(req: Request, res: Response, next: NextFunction) {
    try {
      const uow = getUnitOfWork();
      const service = new ReminderService(uow);

      const updated = await service.sendReminder(
        req.firm_id, 
        req.params.id, 
        req.user_identity || 'CA Partner'
      );

      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const uow = getUnitOfWork();
      const service = new ReminderService(uow);

      const updated = await service.cancelReminder(
        req.firm_id, 
        req.params.id, 
        req.user_identity || 'CA Partner',
        req.body?.reason
      );

      if (!updated) {
        res.status(404).json({
          error: {
            code: 'REMINDER_NOT_FOUND',
            message: `Reminder with ID ${req.params.id} not found.`
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
