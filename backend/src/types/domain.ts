// ========================================================
// CA COPILOT — LOCKED 9-ENTITY DATABASE DOMAIN TYPES
// ========================================================

export type EntityType = 
  | 'Private Limited' 
  | 'Public Limited' 
  | 'LLP' 
  | 'Partnership' 
  | 'Proprietorship' 
  | 'Trust';

export type DocumentType = 
  | 'Sales Register'
  | 'Purchase Register'
  | 'Bank Statement'
  | 'Expense Bills'
  | 'Payroll Summary'
  | 'Payroll Register'
  | 'TDS Return'
  | 'Customs Duty Challan'
  | 'GST 3B Supporting'
  | 'GSTR-1 Data'
  | 'Other';

export type ProcessingStatus = 'Received' | 'Processing' | 'Processed' | 'Failed';
export type ValidationStatus = 'Pending' | 'Valid' | 'Review Required' | 'Invalid';
export type PeriodRequirementStatus = 'Required' | 'Not Required';

export type AlertType = 
  | 'Missing Document' 
  | 'Wrong Period' 
  | 'Duplicate' 
  | 'Review Required' 
  | 'Unknown Client' 
  | 'Invalid Document' 
  | 'Other';

export type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type AlertStatus = 'Open' | 'In Progress' | 'Resolved' | 'Dismissed';

export type ReminderStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Sent' | 'Cancelled';

// 1. FIRMS
export interface Firm {
  firm_id: string;
  legal_name: string;
  display_name: string;
  firm_type: string;
  primary_email: string;
  primary_phone: string;
  address: string;
  timezone: string;
  active: boolean;
  created_at: string;
}

// 2. CLIENTS
export interface Client {
  client_id: string;
  firm_id: string;
  legal_name: string;
  display_name: string;
  entity_type: EntityType;
  primary_email: string;
  phone: string;
  assigned_ca: string;
  active: boolean;
  created_at: string;
}

// 3. DOCUMENT_REQUIREMENTS
export interface DocumentRequirement {
  requirement_id: string;
  firm_id: string;
  client_id: string;
  document_type: DocumentType;
  frequency: 'Monthly' | 'Quarterly' | 'Annual' | 'Ad-hoc';
  due_day: number;
  active: boolean;
  created_at: string;
}

// 4. PERIOD_REQUIREMENTS
export interface PeriodRequirement {
  period_requirement_id: string;
  firm_id: string;
  client_id: string;
  document_type: DocumentType;
  period: string; // e.g. "2026-08" or "2026-Q2"
  status: PeriodRequirementStatus;
  reason?: string;
  updated_by: string;
  updated_at: string;
}

// 5. DOCUMENTS
export interface Document {
  document_id: string;
  firm_id: string;
  client_id: string;
  document_type: DocumentType;
  period: string;
  filename: string;
  email_id: string;
  sender_email: string;
  received_at: string;
  drive_file_id?: string;
  processing_status: ProcessingStatus;
  validation_status: ValidationStatus;
  ai_confidence: number; // 0.00 to 1.00
  file_hash?: string;
  created_at: string;
  notes?: string;
  file_size?: string;
  email_subject?: string;
}

// 6. ALERTS
export interface Alert {
  alert_id: string;
  firm_id: string;
  client_id: string;
  document_type: DocumentType;
  period: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  created_at: string;
  resolved_at?: string | null;
  assigned_to: string;
}

// 7. REMINDERS
export interface Reminder {
  reminder_id: string;
  firm_id: string;
  client_id: string;
  document_type: DocumentType;
  period: string;
  recipient_email: string;
  subject: string;
  body: string;
  status: ReminderStatus;
  created_at: string;
  sent_at?: string | null;
  approved_by?: string | null;
}

// 8. AUDIT_LOG
export interface AuditLog {
  log_id: string;
  firm_id: string;
  timestamp: string;
  user: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: string | null;
  new_value?: string | null;
  reason?: string | null;
}

// 9. SETTINGS
export interface Setting {
  setting_id: string;
  firm_id: string;
  category: 'AI' | 'Compliance' | 'Notifications' | 'System';
  setting_key: string;
  setting_value: string;
  description: string;
  active: boolean;
  updated_at: string;
}
