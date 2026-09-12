import { 
  Client, 
  Document, 
  Alert, 
  Reminder, 
  AuditLog, 
  Setting, 
  DocumentType, 
  EntityType, 
  ValidationStatus, 
  ProcessingStatus, 
  AlertType,
  PeriodRequirement
} from './domain.js';

// Standard API response structures
export interface ApiResponse<T> {
  data: T;
}

export interface ApiPaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    page_size: number;
    total: number;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// Intake Inbox specific structures
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

export interface IntakeStats {
  all_count: number;
  needs_review_count: number;
  exceptions_count: number;
  processed_count: number;
}

// Dashboard structures
export interface DashboardAttentionMetrics {
  missing_documents: number;
  needs_review: number;
  pending_approval: number;
  automatically_processed: number;
}

export interface PriorityWorkItem {
  id: string;
  client_id: string;
  client_name: string;
  client_initials: string;
  document_type: DocumentType | string;
  period: string;
  status: 'Missing' | 'Needs Review' | 'Reminder Ready' | 'Pending Approval' | 'Processed';
  priority: 'High' | 'Medium' | 'Low';
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

export interface SecondaryMetrics {
  total_clients: { count: number; change_pct: number; period_text: string; is_increase: boolean };
  documents_received: { count: number; change_pct: number; period_text: string; is_increase: boolean };
  open_alerts: { count: number; change_pct: number; period_text: string; is_increase: boolean; is_positive_trend: boolean };
  upcoming_reminders: { count: number; change_pct: number; period_text: string; is_increase: boolean };
}

export interface ComplianceMatrixItem {
  client_id: string;
  client_name: string;
  period: string;
  document_type: DocumentType;
  status: 'Received' | 'Missing' | 'Review Required' | 'Wrong Period' | 'Not Required';
  due_date: string;
  document_id?: string;
  alert_id?: string;
}

export interface ComplianceSummary {
  on_track: number;
  missing: number;
  needs_review: number;
  pending: number;
  not_required: number;
  total: number;
  on_track_percentage: number;
}

// Webhook DTOs
export interface DocumentIntakeWebhookPayload {
  email_id?: string;
  sender_email: string;
  sender_name?: string;
  email_subject?: string;
  received_at?: string;
  filename: string;
  file_size?: string;
  file_hash?: string;
  drive_file_id?: string;
  raw_extracted_text?: string;
  ai_extracted?: {
    client_company_name?: string;
    document_type?: string;
    applicable_period?: string;
    financial_year?: string;
  };
  ai_confidence?: number;
}
