import { 
  Firm, 
  Client, 
  DocumentRequirement, 
  PeriodRequirement, 
  Document, 
  Alert, 
  Reminder, 
  AuditLog, 
  Setting 
} from '../types/domain.js';
import { 
  IFirmRepository, 
  IClientRepository, 
  IDocumentRequirementRepository, 
  IPeriodRequirementRepository, 
  IDocumentRepository, 
  IAlertRepository, 
  IReminderRepository, 
  IAuditLogRepository, 
  ISettingRepository, 
  IUnitOfWork 
} from './interfaces.js';

// Seed initial data for development / mock mode
export function getInitialSeedData() {
  const firms: Firm[] = [
    {
      firm_id: 'FIRM-001',
      legal_name: 'Apex Accounting & Advisory LLP',
      display_name: 'Apex Advisory',
      firm_type: 'LLP',
      primary_email: 'compliance@apexadvisory.in',
      primary_phone: '+91 22 4900 1200',
      address: 'Nariman Point, Mumbai, Maharashtra 400021',
      timezone: 'Asia/Kolkata',
      active: true,
      created_at: '2026-01-01T09:00:00Z'
    },
    {
      firm_id: 'FIRM-002',
      legal_name: 'Beacon & Co Chartered Accountants',
      display_name: 'Beacon CA',
      firm_type: 'Partnership',
      primary_email: 'admin@beaconca.com',
      primary_phone: '+91 80 2211 4455',
      address: 'MG Road, Bangalore, Karnataka 560001',
      timezone: 'Asia/Kolkata',
      active: true,
      created_at: '2026-01-15T09:00:00Z'
    }
  ];

  const clients: Client[] = [
    {
      client_id: 'CLI-001',
      firm_id: 'FIRM-001',
      legal_name: 'Acme Global Pvt Ltd',
      display_name: 'Acme Global',
      entity_type: 'Private Limited',
      primary_email: 'finance@acmeglobal.com',
      phone: '+91 98201 11223',
      assigned_ca: 'CA Rajesh Sharma',
      active: true,
      created_at: '2026-01-10T10:00:00Z'
    },
    {
      client_id: 'CLI-002',
      firm_id: 'FIRM-001',
      legal_name: 'Nexus FinTech LLP',
      display_name: 'Nexus FinTech',
      entity_type: 'LLP',
      primary_email: 'accounts@nexusfintech.io',
      phone: '+91 98202 22334',
      assigned_ca: 'CA Sneha Mehta',
      active: true,
      created_at: '2026-01-12T10:00:00Z'
    },
    {
      client_id: 'CLI-003',
      firm_id: 'FIRM-001',
      legal_name: 'Vanguard Retail Enterprises',
      display_name: 'Vanguard Retail',
      entity_type: 'Proprietorship',
      primary_email: 'tax@vanguardretail.in',
      phone: '+91 98203 33445',
      assigned_ca: 'CA Amit Verma',
      active: true,
      created_at: '2026-01-15T10:00:00Z'
    },
    {
      client_id: 'CLI-004',
      firm_id: 'FIRM-001',
      legal_name: 'Zenith Logistics Ltd',
      display_name: 'Zenith Logistics',
      entity_type: 'Public Limited',
      primary_email: 'accounts@zenithlogistics.com',
      phone: '+91 98204 44556',
      assigned_ca: 'CA Rajesh Sharma',
      active: true,
      created_at: '2026-01-20T10:00:00Z'
    },
    {
      client_id: 'CLI-005',
      firm_id: 'FIRM-001',
      legal_name: 'BlueSky Exports Pvt Ltd',
      display_name: 'BlueSky Exports',
      entity_type: 'Private Limited',
      primary_email: 'finance@blueskyexports.com',
      phone: '+91 98205 55667',
      assigned_ca: 'CA Sneha Mehta',
      active: true,
      created_at: '2026-02-01T10:00:00Z'
    }
  ];

  const documentRequirements: DocumentRequirement[] = [
    // Acme Global
    { requirement_id: 'REQ-001', firm_id: 'FIRM-001', client_id: 'CLI-001', document_type: 'Sales Register', frequency: 'Monthly', due_day: 10, active: true, created_at: '2026-01-10T10:00:00Z' },
    { requirement_id: 'REQ-002', firm_id: 'FIRM-001', client_id: 'CLI-001', document_type: 'Purchase Register', frequency: 'Monthly', due_day: 10, active: true, created_at: '2026-01-10T10:00:00Z' },
    { requirement_id: 'REQ-003', firm_id: 'FIRM-001', client_id: 'CLI-001', document_type: 'Bank Statement', frequency: 'Monthly', due_day: 7, active: true, created_at: '2026-01-10T10:00:00Z' },
    { requirement_id: 'REQ-004', firm_id: 'FIRM-001', client_id: 'CLI-001', document_type: 'Payroll Register', frequency: 'Monthly', due_day: 5, active: true, created_at: '2026-01-10T10:00:00Z' },
    
    // Nexus FinTech
    { requirement_id: 'REQ-005', firm_id: 'FIRM-001', client_id: 'CLI-002', document_type: 'Sales Register', frequency: 'Monthly', due_day: 10, active: true, created_at: '2026-01-12T10:00:00Z' },
    { requirement_id: 'REQ-006', firm_id: 'FIRM-001', client_id: 'CLI-002', document_type: 'Purchase Register', frequency: 'Monthly', due_day: 10, active: true, created_at: '2026-01-12T10:00:00Z' },
    { requirement_id: 'REQ-007', firm_id: 'FIRM-001', client_id: 'CLI-002', document_type: 'Bank Statement', frequency: 'Monthly', due_day: 7, active: true, created_at: '2026-01-12T10:00:00Z' },
    
    // Vanguard Retail
    { requirement_id: 'REQ-008', firm_id: 'FIRM-001', client_id: 'CLI-003', document_type: 'Sales Register', frequency: 'Monthly', due_day: 10, active: true, created_at: '2026-01-15T10:00:00Z' },
    { requirement_id: 'REQ-009', firm_id: 'FIRM-001', client_id: 'CLI-003', document_type: 'Bank Statement', frequency: 'Monthly', due_day: 7, active: true, created_at: '2026-01-15T10:00:00Z' },

    // Zenith Logistics
    { requirement_id: 'REQ-010', firm_id: 'FIRM-001', client_id: 'CLI-004', document_type: 'Sales Register', frequency: 'Monthly', due_day: 10, active: true, created_at: '2026-01-20T10:00:00Z' },
    { requirement_id: 'REQ-011', firm_id: 'FIRM-001', client_id: 'CLI-004', document_type: 'Purchase Register', frequency: 'Monthly', due_day: 10, active: true, created_at: '2026-01-20T10:00:00Z' },
    { requirement_id: 'REQ-012', firm_id: 'FIRM-001', client_id: 'CLI-004', document_type: 'Customs Duty Challan', frequency: 'Monthly', due_day: 15, active: true, created_at: '2026-01-20T10:00:00Z' },

    // BlueSky Exports
    { requirement_id: 'REQ-013', firm_id: 'FIRM-001', client_id: 'CLI-005', document_type: 'Sales Register', frequency: 'Monthly', due_day: 10, active: true, created_at: '2026-02-01T10:00:00Z' },
    { requirement_id: 'REQ-014', firm_id: 'FIRM-001', client_id: 'CLI-005', document_type: 'Bank Statement', frequency: 'Monthly', due_day: 7, active: true, created_at: '2026-02-01T10:00:00Z' }
  ];

  const periodRequirements: PeriodRequirement[] = [
    {
      period_requirement_id: 'PRQ-001',
      firm_id: 'FIRM-001',
      client_id: 'CLI-004',
      document_type: 'Customs Duty Challan',
      period: '2026-08',
      status: 'Not Required',
      reason: 'No export/import shipments executed during August 2026',
      updated_by: 'CA Rajesh Sharma',
      updated_at: '2026-09-02T14:30:00Z'
    }
  ];

  const documents: Document[] = [
    {
      document_id: 'DOC-001',
      firm_id: 'FIRM-001',
      client_id: 'CLI-001',
      document_type: 'Sales Register',
      period: '2026-08',
      filename: 'Acme_Sales_Aug2026.xlsx',
      email_id: 'EML-101',
      sender_email: 'finance@acmeglobal.com',
      received_at: '2026-09-08T10:30:00Z',
      processing_status: 'Processed',
      validation_status: 'Valid',
      ai_confidence: 0.98,
      created_at: '2026-09-08T10:32:00Z',
      file_size: '2.4 MB',
      email_subject: 'Acme August 2026 Sales Invoices'
    },
    {
      document_id: 'DOC-002',
      firm_id: 'FIRM-001',
      client_id: 'CLI-001',
      document_type: 'Bank Statement',
      period: '2026-08',
      filename: 'HDFC_Acme_Aug2026.pdf',
      email_id: 'EML-102',
      sender_email: 'finance@acmeglobal.com',
      received_at: '2026-09-08T11:15:00Z',
      processing_status: 'Processed',
      validation_status: 'Valid',
      ai_confidence: 0.96,
      created_at: '2026-09-08T11:16:00Z',
      file_size: '1.8 MB',
      email_subject: 'HDFC Bank Statement August'
    },
    {
      document_id: 'DOC-003',
      firm_id: 'FIRM-001',
      client_id: 'CLI-002',
      document_type: 'Purchase Register',
      period: '2026-08',
      filename: 'Nexus_Purchases_Aug.pdf',
      email_id: 'EML-103',
      sender_email: 'accounts@nexusfintech.io',
      received_at: '2026-09-09T14:20:00Z',
      processing_status: 'Processing',
      validation_status: 'Review Required',
      ai_confidence: 0.88,
      created_at: '2026-09-09T14:22:00Z',
      notes: 'Extraction confidence (0.88) requires CA review for column alignment.',
      file_size: '3.1 MB',
      email_subject: 'Purchase Register - Aug 2026'
    },
    {
      document_id: 'DOC-004',
      firm_id: 'FIRM-001',
      client_id: 'CLI-003',
      document_type: 'Sales Register',
      period: '2026-07',
      filename: 'Vanguard_Sales_July2026.xlsx',
      email_id: 'EML-104',
      sender_email: 'tax@vanguardretail.in',
      received_at: '2026-09-10T09:45:00Z',
      processing_status: 'Received',
      validation_status: 'Review Required',
      ai_confidence: 0.91,
      created_at: '2026-09-10T09:47:00Z',
      notes: 'Wrong Period received: Document is for 2026-07 but current expected period is 2026-08.',
      file_size: '1.2 MB',
      email_subject: 'Sales data file'
    },
    {
      document_id: 'DOC-005',
      firm_id: 'FIRM-001',
      client_id: 'CLI-005',
      document_type: 'Bank Statement',
      period: '2026-08',
      filename: 'ICICI_Statement_Aug26.pdf',
      email_id: 'EML-105',
      sender_email: 'finance@blueskyexports.com',
      received_at: '2026-09-11T16:00:00Z',
      processing_status: 'Processed',
      validation_status: 'Valid',
      ai_confidence: 0.97,
      created_at: '2026-09-11T16:02:00Z',
      file_size: '4.5 MB',
      email_subject: 'ICICI Bank Statement'
    }
  ];

  const alerts: Alert[] = [
    {
      alert_id: 'ALT-001',
      firm_id: 'FIRM-001',
      client_id: 'CLI-001',
      document_type: 'Purchase Register',
      period: '2026-08',
      alert_type: 'Missing Document',
      severity: 'High',
      message: 'Purchase Register for August 2026 was due on 10-Sep-2026 and has not been received.',
      status: 'Open',
      created_at: '2026-09-11T00:00:00Z',
      assigned_to: 'CA Rajesh Sharma'
    },
    {
      alert_id: 'ALT-002',
      firm_id: 'FIRM-001',
      client_id: 'CLI-002',
      document_type: 'Purchase Register',
      period: '2026-08',
      alert_type: 'Review Required',
      severity: 'Medium',
      message: 'AI Extraction confidence (88%) is below auto-process threshold (95%). Needs CA review.',
      status: 'Open',
      created_at: '2026-09-09T14:23:00Z',
      assigned_to: 'CA Sneha Mehta'
    },
    {
      alert_id: 'ALT-003',
      firm_id: 'FIRM-001',
      client_id: 'CLI-003',
      document_type: 'Sales Register',
      period: '2026-07',
      alert_type: 'Wrong Period',
      severity: 'Medium',
      message: 'Document received for July 2026 while August 2026 intake is active.',
      status: 'Open',
      created_at: '2026-09-10T09:48:00Z',
      assigned_to: 'CA Amit Verma'
    }
  ];

  const reminders: Reminder[] = [
    {
      reminder_id: 'REM-001',
      firm_id: 'FIRM-001',
      client_id: 'CLI-001',
      document_type: 'Purchase Register',
      period: '2026-08',
      recipient_email: 'finance@acmeglobal.com',
      subject: 'Urgent: Missing Purchase Register for August 2026 - Acme Global',
      body: 'Dear Acme Global Finance Team,\n\nOur compliance records indicate that your Purchase Register for August 2026 (due 10-Sep-2026) is pending. Please upload or reply with the file to avoid statutory delay.\n\nRegards,\nApex Advisory',
      status: 'Pending Approval',
      created_at: '2026-09-11T09:00:00Z',
      sent_at: null,
      approved_by: null
    },
    {
      reminder_id: 'REM-002',
      firm_id: 'FIRM-001',
      client_id: 'CLI-003',
      document_type: 'Bank Statement',
      period: '2026-08',
      recipient_email: 'tax@vanguardretail.in',
      subject: 'Reminder: August 2026 Bank Statement Pending - Vanguard Retail',
      body: 'Dear Vanguard Retail Team,\n\nPlease provide your primary bank statement for August 2026 at your earliest convenience.\n\nRegards,\nApex Advisory',
      status: 'Draft',
      created_at: '2026-09-11T10:00:00Z',
      sent_at: null,
      approved_by: null
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      log_id: 'LOG-001',
      firm_id: 'FIRM-001',
      timestamp: '2026-09-08T10:32:00Z',
      user: 'Make.com Ingestion Webhook',
      action: 'DOCUMENT_INGESTED',
      entity_type: 'Document',
      entity_id: 'DOC-001',
      old_value: null,
      new_value: JSON.stringify({ filename: 'Acme_Sales_Aug2026.xlsx', confidence: 0.98, status: 'Processed' }),
      reason: 'Automated intake via Gmail webhook'
    },
    {
      log_id: 'LOG-002',
      firm_id: 'FIRM-001',
      timestamp: '2026-09-09T14:23:00Z',
      user: 'CA Copilot Rule Engine',
      action: 'ALERT_CREATED',
      entity_type: 'Alert',
      entity_id: 'ALT-002',
      old_value: null,
      new_value: JSON.stringify({ type: 'Review Required', severity: 'Medium' }),
      reason: 'Confidence 0.88 < 0.95 threshold'
    },
    {
      log_id: 'LOG-003',
      firm_id: 'FIRM-001',
      timestamp: '2026-09-11T09:00:00Z',
      user: 'Compliance Engine',
      action: 'REMINDER_DRAFTED',
      entity_type: 'Reminder',
      entity_id: 'REM-001',
      old_value: null,
      new_value: JSON.stringify({ status: 'Pending Approval', recipient: 'finance@acmeglobal.com' }),
      reason: 'Due date passed for CLI-001 Purchase Register'
    }
  ];

  const settings: Setting[] = [
    { setting_id: 'SET-001', firm_id: 'FIRM-001', category: 'AI', setting_key: 'AUTO_PROCESS_CONFIDENCE', setting_value: '0.95', description: 'Confidence threshold (>= 0.95) for automatic document processing', active: true, updated_at: '2026-01-01T00:00:00Z' },
    { setting_id: 'SET-002', firm_id: 'FIRM-001', category: 'AI', setting_key: 'REVIEW_CONFIDENCE', setting_value: '0.80', description: 'Confidence threshold (0.80 to 0.949) below which CA review is required', active: true, updated_at: '2026-01-01T00:00:00Z' },
    { setting_id: 'SET-003', firm_id: 'FIRM-001', category: 'System', setting_key: 'DEFAULT_TIMEZONE', setting_value: 'Asia/Kolkata', description: 'Default timezone for CA compliance deadlines and logs', active: true, updated_at: '2026-01-01T00:00:00Z' },
    { setting_id: 'SET-004', firm_id: 'FIRM-001', category: 'System', setting_key: 'DEFAULT_PERIOD_FORMAT', setting_value: 'YYYY-MM', description: 'Standard period formatting structure', active: true, updated_at: '2026-01-01T00:00:00Z' },
    { setting_id: 'SET-005', firm_id: 'FIRM-001', category: 'Notifications', setting_key: 'ENABLE_REMINDERS', setting_value: 'true', description: 'Enable CA reminder drafting workflow', active: true, updated_at: '2026-01-01T00:00:00Z' }
  ];

  return {
    firms,
    clients,
    documentRequirements,
    periodRequirements,
    documents,
    alerts,
    reminders,
    auditLogs,
    settings
  };
}

export class MemoryFirmRepository implements IFirmRepository {
  constructor(private firms: Firm[]) {}
  async findById(firm_id: string): Promise<Firm | null> {
    return this.firms.find(f => f.firm_id === firm_id) || null;
  }
  async findAll(): Promise<Firm[]> {
    return [...this.firms];
  }
}

export class MemoryClientRepository implements IClientRepository {
  constructor(private clients: Client[]) {}
  async findById(firm_id: string, client_id: string): Promise<Client | null> {
    return this.clients.find(c => c.firm_id === firm_id && c.client_id === client_id) || null;
  }
  async findByEmail(firm_id: string, email: string): Promise<Client | null> {
    const cleanEmail = email.trim().toLowerCase();
    return this.clients.find(c => c.firm_id === firm_id && c.primary_email.trim().toLowerCase() === cleanEmail) || null;
  }
  async findAll(firm_id: string): Promise<Client[]> {
    return this.clients.filter(c => c.firm_id === firm_id);
  }
  async create(client: Client): Promise<Client> {
    this.clients.push(client);
    return client;
  }
  async update(firm_id: string, client_id: string, data: Partial<Client>): Promise<Client | null> {
    const idx = this.clients.findIndex(c => c.firm_id === firm_id && c.client_id === client_id);
    if (idx === -1) return null;
    this.clients[idx] = { ...this.clients[idx], ...data };
    return this.clients[idx];
  }
}

export class MemoryDocumentRequirementRepository implements IDocumentRequirementRepository {
  constructor(private requirements: DocumentRequirement[]) {}
  async findByClient(firm_id: string, client_id: string): Promise<DocumentRequirement[]> {
    return this.requirements.filter(r => r.firm_id === firm_id && r.client_id === client_id && r.active);
  }
  async findAll(firm_id: string): Promise<DocumentRequirement[]> {
    return this.requirements.filter(r => r.firm_id === firm_id);
  }
  async create(requirement: DocumentRequirement): Promise<DocumentRequirement> {
    this.requirements.push(requirement);
    return requirement;
  }
}

export class MemoryPeriodRequirementRepository implements IPeriodRequirementRepository {
  constructor(private overrides: PeriodRequirement[]) {}
  async findByClientAndPeriod(firm_id: string, client_id: string, period: string): Promise<PeriodRequirement[]> {
    return this.overrides.filter(o => o.firm_id === firm_id && o.client_id === client_id && o.period === period);
  }
  async findOverride(firm_id: string, client_id: string, document_type: string, period: string): Promise<PeriodRequirement | null> {
    return this.overrides.find(o => 
      o.firm_id === firm_id && 
      o.client_id === client_id && 
      o.document_type.toLowerCase() === document_type.toLowerCase() && 
      o.period === period
    ) || null;
  }
  async findAll(firm_id: string): Promise<PeriodRequirement[]> {
    return this.overrides.filter(o => o.firm_id === firm_id);
  }
  async upsert(override: PeriodRequirement): Promise<PeriodRequirement> {
    const idx = this.overrides.findIndex(o => 
      o.firm_id === override.firm_id && 
      o.client_id === override.client_id && 
      o.document_type === override.document_type && 
      o.period === override.period
    );
    if (idx >= 0) {
      this.overrides[idx] = override;
    } else {
      this.overrides.push(override);
    }
    return override;
  }
}

export class MemoryDocumentRepository implements IDocumentRepository {
  constructor(private documents: Document[]) {}
  async findById(firm_id: string, document_id: string): Promise<Document | null> {
    return this.documents.find(d => d.firm_id === firm_id && d.document_id === document_id) || null;
  }
  async findAll(firm_id: string): Promise<Document[]> {
    return this.documents.filter(d => d.firm_id === firm_id);
  }
  async findByClientAndPeriod(firm_id: string, client_id: string, period: string): Promise<Document[]> {
    return this.documents.filter(d => d.firm_id === firm_id && d.client_id === client_id && d.period === period);
  }
  async findExisting(firm_id: string, client_id: string, document_type: string, period: string): Promise<Document | null> {
    return this.documents.find(d => 
      d.firm_id === firm_id && 
      d.client_id === client_id && 
      d.document_type.toLowerCase() === document_type.toLowerCase() && 
      d.period === period
    ) || null;
  }
  async findByEmailOrHash(firm_id: string, email_id?: string, file_hash?: string, filename?: string): Promise<Document | null> {
    return this.documents.find(d => {
      if (d.firm_id !== firm_id) return false;
      if (file_hash && d.file_hash === file_hash) return true;
      if (email_id && filename && d.email_id === email_id && d.filename === filename) return true;
      return false;
    }) || null;
  }
  async create(document: Document): Promise<Document> {
    this.documents.push(document);
    return document;
  }
  async update(firm_id: string, document_id: string, data: Partial<Document>): Promise<Document | null> {
    const idx = this.documents.findIndex(d => d.firm_id === firm_id && d.document_id === document_id);
    if (idx === -1) return null;
    this.documents[idx] = { ...this.documents[idx], ...data };
    return this.documents[idx];
  }
}

export class MemoryAlertRepository implements IAlertRepository {
  constructor(private alerts: Alert[]) {}
  async findById(firm_id: string, alert_id: string): Promise<Alert | null> {
    return this.alerts.find(a => a.firm_id === firm_id && a.alert_id === alert_id) || null;
  }
  async findAll(firm_id: string): Promise<Alert[]> {
    return this.alerts.filter(a => a.firm_id === firm_id);
  }
  async findOpenByClientAndDoc(firm_id: string, client_id: string, document_type: string, period: string, alert_type?: string): Promise<Alert | null> {
    return this.alerts.find(a => 
      a.firm_id === firm_id && 
      a.client_id === client_id && 
      a.document_type.toLowerCase() === document_type.toLowerCase() && 
      a.period === period &&
      a.status === 'Open' &&
      (!alert_type || a.alert_type === alert_type)
    ) || null;
  }
  async create(alert: Alert): Promise<Alert> {
    this.alerts.push(alert);
    return alert;
  }
  async update(firm_id: string, alert_id: string, data: Partial<Alert>): Promise<Alert | null> {
    const idx = this.alerts.findIndex(a => a.firm_id === firm_id && a.alert_id === alert_id);
    if (idx === -1) return null;
    this.alerts[idx] = { ...this.alerts[idx], ...data };
    return this.alerts[idx];
  }
}

export class MemoryReminderRepository implements IReminderRepository {
  constructor(private reminders: Reminder[]) {}
  async findById(firm_id: string, reminder_id: string): Promise<Reminder | null> {
    return this.reminders.find(r => r.firm_id === firm_id && r.reminder_id === reminder_id) || null;
  }
  async findAll(firm_id: string): Promise<Reminder[]> {
    return this.reminders.filter(r => r.firm_id === firm_id);
  }
  async create(reminder: Reminder): Promise<Reminder> {
    this.reminders.push(reminder);
    return reminder;
  }
  async update(firm_id: string, reminder_id: string, data: Partial<Reminder>): Promise<Reminder | null> {
    const idx = this.reminders.findIndex(r => r.firm_id === firm_id && r.reminder_id === reminder_id);
    if (idx === -1) return null;
    this.reminders[idx] = { ...this.reminders[idx], ...data };
    return this.reminders[idx];
  }
}

export class MemoryAuditLogRepository implements IAuditLogRepository {
  constructor(private auditLogs: AuditLog[]) {}
  async findAll(firm_id: string): Promise<AuditLog[]> {
    return this.auditLogs.filter(l => l.firm_id === firm_id);
  }
  async append(log: AuditLog): Promise<AuditLog> {
    // Append-only guarantee
    this.auditLogs.push(log);
    return log;
  }
}

export class MemorySettingRepository implements ISettingRepository {
  constructor(private settings: Setting[]) {}
  async findByKey(firm_id: string, setting_key: string): Promise<Setting | null> {
    return this.settings.find(s => s.firm_id === firm_id && s.setting_key === setting_key && s.active) || null;
  }
  async findAll(firm_id: string): Promise<Setting[]> {
    return this.settings.filter(s => s.firm_id === firm_id);
  }
  async update(firm_id: string, setting_key: string, setting_value: string, updated_by?: string): Promise<Setting | null> {
    const idx = this.settings.findIndex(s => s.firm_id === firm_id && s.setting_key === setting_key);
    if (idx === -1) return null;
    this.settings[idx] = {
      ...this.settings[idx],
      setting_value,
      updated_at: new Date().toISOString()
    };
    return this.settings[idx];
  }
}

export class MemoryUnitOfWork implements IUnitOfWork {
  firms: IFirmRepository;
  clients: IClientRepository;
  documentRequirements: IDocumentRequirementRepository;
  periodRequirements: IPeriodRequirementRepository;
  documents: IDocumentRepository;
  alerts: IAlertRepository;
  reminders: IReminderRepository;
  auditLogs: IAuditLogRepository;
  settings: ISettingRepository;

  constructor(seed = getInitialSeedData()) {
    this.firms = new MemoryFirmRepository(seed.firms);
    this.clients = new MemoryClientRepository(seed.clients);
    this.documentRequirements = new MemoryDocumentRequirementRepository(seed.documentRequirements);
    this.periodRequirements = new MemoryPeriodRequirementRepository(seed.periodRequirements);
    this.documents = new MemoryDocumentRepository(seed.documents);
    this.alerts = new MemoryAlertRepository(seed.alerts);
    this.reminders = new MemoryReminderRepository(seed.reminders);
    this.auditLogs = new MemoryAuditLogRepository(seed.auditLogs);
    this.settings = new MemorySettingRepository(seed.settings);
  }
}
