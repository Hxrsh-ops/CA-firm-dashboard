import { z } from 'zod';

export const documentReviewSchema = z.object({
  action: z.enum(['approve', 'reject', 'reclassify']),
  document_type: z.string().optional(),
  period: z.string().optional(),
  notes: z.string().optional(),
  reviewed_by: z.string().default('CA Partner')
});

export const createReminderSchema = z.object({
  client_id: z.string().min(1, 'client_id is required'),
  document_type: z.string().min(1, 'document_type is required'),
  period: z.string().min(1, 'period is required'),
  recipient_email: z.string().email('valid recipient_email is required'),
  subject: z.string().min(1, 'subject is required'),
  body: z.string().min(1, 'body is required')
});

export const updateReminderSchema = z.object({
  subject: z.string().optional(),
  body: z.string().optional(),
  recipient_email: z.string().email().optional()
});

export const approveReminderSchema = z.object({
  approved_by: z.string().min(1, 'approved_by is required')
});

export const updateAlertSchema = z.object({
  status: z.enum(['Open', 'In Progress', 'Resolved', 'Dismissed']),
  resolved_at: z.string().optional(),
  notes: z.string().optional(),
  updated_by: z.string().default('CA Partner')
});

export const updateSettingSchema = z.object({
  setting_value: z.string().min(1, 'setting_value is required'),
  updated_by: z.string().default('CA Partner')
});

export const documentIntakeWebhookSchema = z.object({
  email_id: z.string().optional(),
  sender_email: z.string().email('sender_email must be a valid email'),
  sender_name: z.string().optional(),
  email_subject: z.string().optional(),
  received_at: z.string().optional(),
  filename: z.string().min(1, 'filename is required'),
  file_size: z.string().optional(),
  file_hash: z.string().optional(),
  drive_file_id: z.string().optional(),
  raw_extracted_text: z.string().optional(),
  ai_extracted: z.object({
    client_company_name: z.string().optional(),
    document_type: z.string().optional(),
    applicable_period: z.string().optional(),
    financial_year: z.string().optional()
  }).optional(),
  ai_confidence: z.number().min(0).max(1).optional()
});
