import { Request, Response, NextFunction } from 'express';
import { getUnitOfWork } from '../repositories/index.js';
import { DocumentService } from '../services/documentService.js';
import { ReminderService } from '../services/reminderService.js';
import { documentIntakeWebhookSchema } from '../schemas/validation.js';

export class WebhookController {
  /**
   * Inbound Document Intake Webhook (Triggered by Make.com Gmail Ingestion)
   */
  static async handleDocumentIntake(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = documentIntakeWebhookSchema.parse(req.body);
      const uow = getUnitOfWork();
      const service = new DocumentService(uow);

      const result = await service.processIntakeDocument(req.firm_id, payload);

      res.status(200).json({
        data: {
          document: result.document,
          is_duplicate: result.isDuplicate,
          is_unknown_client: result.isUnknownClient,
          message: result.isDuplicate 
            ? 'Document already received (duplicate detected).' 
            : result.isUnknownClient 
              ? 'Document intake recorded with Unknown Client alert.' 
              : 'Document successfully processed and categorized.'
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Reminder Dispatch Webhook Status / Execution Trigger
   */
  static async handleReminderSend(req: Request, res: Response, next: NextFunction) {
    try {
      const { reminder_id, status_update } = req.body;
      if (!reminder_id) {
        res.status(400).json({
          error: {
            code: 'MISSING_REMINDER_ID',
            message: 'reminder_id is required in webhook payload.'
          }
        });
        return;
      }

      const uow = getUnitOfWork();
      const reminder = await uow.reminders.findById(req.firm_id, reminder_id);
      if (!reminder) {
        res.status(404).json({
          error: {
            code: 'REMINDER_NOT_FOUND',
            message: `Reminder with ID ${reminder_id} not found.`
          }
        });
        return;
      }

      // If Make.com is calling back with delivery confirmation
      if (status_update === 'delivered' || status_update === 'sent') {
        const updated = await uow.reminders.update(req.firm_id, reminder_id, {
          status: 'Sent',
          sent_at: new Date().toISOString()
        });
        res.json({ data: updated });
        return;
      }

      // If triggering dispatch via webhook, enforce CA approval check
      const service = new ReminderService(uow);
      const sent = await service.sendReminder(req.firm_id, reminder_id, 'Make Webhook Automation');
      res.json({ data: sent });
    } catch (err) {
      next(err);
    }
  }
}
