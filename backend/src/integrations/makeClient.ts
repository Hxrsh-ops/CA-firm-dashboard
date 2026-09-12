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

export class MakeClient {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = env.MAKE_REMINDER_WEBHOOK_URL;
  }

  isConfigured(): boolean {
    return !!this.webhookUrl && this.webhookUrl.startsWith('http');
  }

  async dispatchApprovedReminder(reminder: Reminder): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.log(`[MakeClient] Mock dispatch (MAKE_REMINDER_WEBHOOK_URL not configured). Reminder ID: ${reminder.reminder_id} marked as sent.`);
      return { success: true };
    }

    try {
      const payload: MakeReminderPayload = {
        reminder_id: reminder.reminder_id,
        firm_id: reminder.firm_id,
        client_id: reminder.client_id,
        document_type: reminder.document_type,
        period: reminder.period,
        recipient_email: reminder.recipient_email,
        subject: reminder.subject,
        body: reminder.body,
        approved_by: reminder.approved_by || 'CA Partner',
        approved_at: new Date().toISOString()
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': env.WEBHOOK_SECRET
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Make webhook returned status ${response.status}: ${await response.text()}`);
      }

      return { success: true };
    } catch (err: any) {
      console.error('[MakeClient] Failed to dispatch reminder webhook:', err);
      return { success: false, error: err.message };
    }
  }
}

export const makeClient = new MakeClient();
