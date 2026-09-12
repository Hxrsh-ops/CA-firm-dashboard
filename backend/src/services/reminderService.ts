import { IUnitOfWork } from '../repositories/interfaces.js';
import { Reminder, DocumentType } from '../types/domain.js';
import { AuditService } from './auditService.js';
import { makeClient } from '../integrations/makeClient.js';

export class ReminderService {
  private auditService: AuditService;

  constructor(private uow: IUnitOfWork) {
    this.auditService = new AuditService(uow);
  }

  async getAllReminders(firm_id: string): Promise<Reminder[]> {
    return this.uow.reminders.findAll(firm_id);
  }

  async getReminderById(firm_id: string, reminderId: string): Promise<Reminder | null> {
    return this.uow.reminders.findById(firm_id, reminderId);
  }

  async createReminder(params: {
    firm_id: string;
    client_id: string;
    document_type: DocumentType;
    period: string;
    recipient_email: string;
    subject: string;
    body: string;
    initial_status?: 'Draft' | 'Pending Approval';
    user?: string;
  }): Promise<Reminder> {
    const reminderId = `REM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const reminder: Reminder = {
      reminder_id: reminderId,
      firm_id: params.firm_id,
      client_id: params.client_id,
      document_type: params.document_type,
      period: params.period,
      recipient_email: params.recipient_email,
      subject: params.subject,
      body: params.body,
      status: params.initial_status || 'Pending Approval',
      created_at: new Date().toISOString(),
      sent_at: null,
      approved_by: null
    };

    const saved = await this.uow.reminders.create(reminder);

    await this.auditService.log({
      firm_id: params.firm_id,
      user: params.user || 'Compliance Engine',
      action: 'REMINDER_CREATED',
      entity_type: 'Reminder',
      entity_id: reminderId,
      new_value: reminder,
      reason: `Reminder drafted for ${params.client_id} ${params.document_type}`
    });

    return saved;
  }

  async updateReminder(
    firm_id: string, 
    reminderId: string, 
    data: { subject?: string; body?: string; recipient_email?: string },
    user = 'CA Partner'
  ): Promise<Reminder | null> {
    const reminder = await this.uow.reminders.findById(firm_id, reminderId);
    if (!reminder) return null;

    if (reminder.status === 'Sent') {
      throw new Error('Cannot edit a reminder that has already been sent.');
    }

    const oldState = { ...reminder };
    const updated = await this.uow.reminders.update(firm_id, reminderId, data);

    if (updated) {
      await this.auditService.log({
        firm_id,
        user,
        action: 'REMINDER_UPDATED',
        entity_type: 'Reminder',
        entity_id: reminderId,
        old_value: oldState,
        new_value: updated,
        reason: 'Reminder text or recipient modified by user'
      });
    }

    return updated;
  }

  /**
   * CA Partner Approval Gate
   */
  async approveReminder(firm_id: string, reminderId: string, approvedBy: string): Promise<Reminder> {
    const reminder = await this.uow.reminders.findById(firm_id, reminderId);
    if (!reminder) {
      throw new Error(`Reminder with ID ${reminderId} not found.`);
    }

    if (reminder.status === 'Sent') {
      throw new Error('Reminder has already been sent.');
    }

    const oldState = { ...reminder };
    const updated = await this.uow.reminders.update(firm_id, reminderId, {
      status: 'Approved',
      approved_by: approvedBy
    });

    if (!updated) {
      throw new Error('Failed to update reminder status.');
    }

    await this.auditService.log({
      firm_id,
      user: approvedBy,
      action: 'REMINDER_APPROVED',
      entity_type: 'Reminder',
      entity_id: reminderId,
      old_value: oldState,
      new_value: updated,
      reason: `Explicit approval granted by CA partner ${approvedBy}`
    });

    return updated;
  }

  /**
   * Dispatch Reminder via Make/Gmail.
   * Strictly requires reminder.status === 'Approved'.
   */
  async sendReminder(firm_id: string, reminderId: string, user = 'CA Partner'): Promise<Reminder> {
    const reminder = await this.uow.reminders.findById(firm_id, reminderId);
    if (!reminder) {
      throw new Error(`Reminder with ID ${reminderId} not found.`);
    }

    // HUMAN-IN-THE-LOOP SAFETY GATE
    if (reminder.status !== 'Approved') {
      throw new Error(`Cannot send reminder: Current status is "${reminder.status}". Reminder must be in "Approved" status before dispatch.`);
    }

    // Dispatch to Make.com outbound webhook
    const dispatchResult = await makeClient.dispatchApprovedReminder(reminder);
    if (!dispatchResult.success) {
      throw new Error(`Failed to dispatch reminder via automation engine: ${dispatchResult.error}`);
    }

    const sentTimestamp = new Date().toISOString();
    const updated = await this.uow.reminders.update(firm_id, reminderId, {
      status: 'Sent',
      sent_at: sentTimestamp
    });

    if (!updated) {
      throw new Error('Failed to mark reminder as sent.');
    }

    await this.auditService.log({
      firm_id,
      user,
      action: 'REMINDER_SENT',
      entity_type: 'Reminder',
      entity_id: reminderId,
      old_value: reminder,
      new_value: updated,
      reason: `Dispatched to ${reminder.recipient_email} via Make/Gmail automation`
    });

    return updated;
  }

  async cancelReminder(firm_id: string, reminderId: string, user = 'CA Partner', reason?: string): Promise<Reminder | null> {
    const reminder = await this.uow.reminders.findById(firm_id, reminderId);
    if (!reminder) return null;

    if (reminder.status === 'Sent') {
      throw new Error('Cannot cancel a reminder that has already been sent.');
    }

    const oldState = { ...reminder };
    const updated = await this.uow.reminders.update(firm_id, reminderId, { status: 'Cancelled' });

    if (updated) {
      await this.auditService.log({
        firm_id,
        user,
        action: 'REMINDER_CANCELLED',
        entity_type: 'Reminder',
        entity_id: reminderId,
        old_value: oldState,
        new_value: updated,
        reason: reason || 'Cancelled by CA partner'
      });
    }

    return updated;
  }
}
