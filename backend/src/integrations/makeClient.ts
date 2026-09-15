import { env } from '../config/env.js';
import { Reminder } from '../types/domain.js';

export interface MakeReminderPayload {
  reminder_id: string;
  firm_id: string;
  client_id: string;
  document_type: string;
  period: string;
  recipient_email: string;
  subject: string;
  body: string;
  approved_by: string;
  approved_at: string;
}

export interface MakeReminderTriggerPayload {
  reminder_id: string;
  firm_id: string;
}

export class MakeClient {
  get webhookUrl(): string {
    return env.MAKE_REMINDER_WORKFLOW_WEBHOOK_URL || env.MAKE_REMINDER_WEBHOOK_URL || '';
  }

  isConfigured(): boolean {
    return !!this.webhookUrl && this.webhookUrl.startsWith('http');
  }

  async dispatchApprovedReminder(reminder: Reminder): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Unable to start reminder workflow. No email was sent.' };
    }

    try {
      const payload: MakeReminderTriggerPayload = {
        reminder_id: reminder.reminder_id,
        firm_id: reminder.firm_id
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Make webhook returned status ${response.status}`);
      }

      return { success: true };
    } catch (err: any) {
      console.error('[MakeClient] Failed to dispatch reminder webhook:', err?.message || 'Network error');
      return { success: false, error: 'Unable to start reminder workflow. No email was sent.' };
    }
  }
}

export const makeClient = new MakeClient();
