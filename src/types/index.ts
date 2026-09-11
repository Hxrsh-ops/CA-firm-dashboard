// ========================================================
// CA COPILOT — DOMAIN TYPES
// Strictly corresponds to the locked 9-entity database schema
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
  | 'GSTR-1 Data';

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
  period: string;
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
  drive_file_id: string;
  processing_status: ProcessingStatus;
  validation_status: ValidationStatus;
  ai_confidence: number; // 0.00 to 1.00
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

// ========================================================
// DERIVED UI VIEW MODELS (Strictly for UI layer presentation)
// ========================================================

export type PriorityLevel = 'High' | 'Medium' | 'Low';
export type WorkItemStatus = 'Missing' | 'Needs Review' | 'Reminder Ready' | 'Pending Approval' | 'Processed';

export interface PriorityWorkItem {
  id: string;
  client_id: string;
  client_name: string;
  client_initials: string;
  document_type: DocumentType | string;
  period: string;
  status: WorkItemStatus;
  priority: PriorityLevel;
  assigned_to: string;
  due_date: string;
  action_hint?: string;
  context_id?: string;
}

export interface RecentActivityItem {
  id: string;
  title: string;
  subtitle: string;
  time_ago: string;
  status: 'Processed' | 'Needs Review' | 'Pending Approval' | 'Info' | 'Failed';
  type: 'document' | 'reminder' | 'client' | 'alert';
  document_id?: string;
}

export interface UpcomingReminderItem {
  id: string;
  day: string;
  month: string;
  title: string;
  client_name: string;
  status: 'Draft Ready' | 'Scheduled' | 'Pending Approval' | 'Sent';
}

export interface DashboardAttentionMetrics {
  missing_documents: number;
  needs_review: number;
  pending_approval: number;
  automatically_processed: number;
}

export interface SecondaryMetrics {
  total_clients: { count: number; change_pct: number; period_text: string; is_increase: boolean };
  documents_received: { count: number; change_pct: number; period_text: string; is_increase: boolean };
  open_alerts: { count: number; change_pct: number; period_text: string; is_increase: boolean; is_positive_trend: boolean };
  upcoming_reminders: { count: number; change_pct: number; period_text: string; is_increase: boolean };
}

export interface ComplianceDistribution {
  on_track: number;
  missing: number;
  needs_review: number;
  pending: number;
  not_required: number;
  total: number;
  on_track_percentage: number;
}

// ========================================================
// AI INTAKE INBOX DERIVED MODELS
// ========================================================

export type IntakeTabFilter = 'all' | 'needs_review' | 'exceptions' | 'processed';

export interface RuleCheckResult {
  client_exists: boolean;
  doc_type_recognized: boolean;
  period_identified: boolean;
  requirement_exists: boolean;
  auto_process_eligible: boolean;
  review_required_reason?: string;
}

export interface EmailAttachmentItem {
  filename: string;
  document_type: string;
  status: ValidationStatus;
  confidence: number;
  is_current?: boolean;
}

export interface IntakeItem {
  document_id: string;
  filename: string;
  file_size: string;
  client_id: string;
  client_name: string;
  client_initials: string;
  entity_type: EntityType;
  assigned_ca: string;
  document_type: DocumentType;
  period: string;
  ai_confidence: number;
  validation_status: ValidationStatus;
  processing_status: ProcessingStatus;
  received_at: string;
  received_formatted: string;
  sender_email: string;
  email_subject: string;
  total_attachments: number;
  attachment_index: number;
  is_exception: boolean;
  exception_type?: AlertType;
  exception_message?: string;
  review_reason?: string;
  notes?: string;
  rule_checks: RuleCheckResult;
  email_attachments: EmailAttachmentItem[];
}
