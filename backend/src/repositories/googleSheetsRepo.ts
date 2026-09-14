import { 
  Firm, 
  Client, 
  DocumentRequirement, 
  PeriodRequirement, 
  Document, 
  Alert, 
  Reminder, 
  AuditLog, 
  Setting,
  EntityType,
  DocumentType,
  ProcessingStatus,
  ValidationStatus,
  PeriodRequirementStatus,
  AlertType,
  AlertSeverity,
  AlertStatus,
  ReminderStatus
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
import { GoogleSheetsClient, googleSheetsClient } from '../integrations/googleSheetsClient.js';

// Helper utilities for data type conversions
const toStr = (val: any): string => (val !== undefined && val !== null ? String(val).trim() : '');
const toBool = (val: any): boolean => String(val).trim().toUpperCase() === 'TRUE';
const toNum = (val: any, fallback = 0): number => {
  if (val === undefined || val === null || val === '') return fallback;
  const n = parseFloat(String(val));
  return isNaN(n) ? fallback : n;
};

function isDataRow(row: any[], headerFirstCol: string): boolean {
  if (!row || !row[0]) return false;
  const first = String(row[0]).trim();
  if (first === '' || first.toLowerCase() === headerFirstCol.toLowerCase() || first.startsWith('SYSTEM NOTE')) {
    return false;
  }
  return true;
}

// 1. FIRMS
export class GoogleSheetsFirmRepository implements IFirmRepository {
  constructor(private client: GoogleSheetsClient = googleSheetsClient) {}

  private rowToFirm(row: any[]): Firm {
    return {
      firm_id: toStr(row[0]),
      legal_name: toStr(row[1]),
      display_name: toStr(row[2]),
      firm_type: toStr(row[3]),
      primary_email: toStr(row[4]),
      primary_phone: toStr(row[5]),
      address: toStr(row[6]),
      timezone: toStr(row[7]),
      active: toBool(row[8]),
      created_at: toStr(row[9])
    };
  }

  async findById(firm_id: string): Promise<Firm | null> {
    const rows = await this.client.getSheetValues('FIRMS!A:J');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'firm_id') && toStr(row[0]) === firm_id) {
        return this.rowToFirm(row);
      }
    }
    return null;
  }

  async findAll(): Promise<Firm[]> {
    const rows = await this.client.getSheetValues('FIRMS!A:J');
    const firms: Firm[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'firm_id')) {
        firms.push(this.rowToFirm(row));
      }
    }
    return firms;
  }
}

// 2. CLIENTS
export class GoogleSheetsClientRepository implements IClientRepository {
  constructor(private client: GoogleSheetsClient = googleSheetsClient) {}

  private rowToClient(row: any[]): Client {
    return {
      client_id: toStr(row[0]),
      firm_id: toStr(row[1]),
      legal_name: toStr(row[2]),
      display_name: toStr(row[3]),
      entity_type: toStr(row[4]) as EntityType,
      primary_email: toStr(row[5]),
      phone: toStr(row[6]),
      assigned_ca: toStr(row[7]),
      active: toBool(row[8]),
      created_at: toStr(row[9])
    };
  }

  private clientToRow(c: Client): any[] {
    return [
      c.client_id,
      c.firm_id,
      c.legal_name,
      c.display_name,
      c.entity_type,
      c.primary_email,
      c.phone,
      c.assigned_ca,
      c.active ? 'TRUE' : 'FALSE',
      c.created_at
    ];
  }

  async findById(firm_id: string, client_id: string): Promise<Client | null> {
    const rows = await this.client.getSheetValues('CLIENTS!A:J');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'client_id') && toStr(row[0]) === client_id && toStr(row[1]) === firm_id) {
        return this.rowToClient(row);
      }
    }
    return null;
  }

  async findByEmail(firm_id: string, email: string): Promise<Client | null> {
    const cleanEmail = email.trim().toLowerCase();
    const rows = await this.client.getSheetValues('CLIENTS!A:J');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'client_id') && toStr(row[1]) === firm_id && toStr(row[5]).toLowerCase() === cleanEmail) {
        return this.rowToClient(row);
      }
    }
    return null;
  }

  async findAll(firm_id: string): Promise<Client[]> {
    const rows = await this.client.getSheetValues('CLIENTS!A:J');
    const clients: Client[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'client_id') && toStr(row[1]) === firm_id) {
        clients.push(this.rowToClient(row));
      }
    }
    return clients;
  }

  async create(client: Client): Promise<Client> {
    await this.client.appendSheetRow('CLIENTS', this.clientToRow(client));
    return client;
  }

  async update(firm_id: string, client_id: string, data: Partial<Client>): Promise<Client | null> {
    const rows = await this.client.getSheetValues('CLIENTS!A:J');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'client_id') && toStr(row[0]) === client_id && toStr(row[1]) === firm_id) {
        const existing = this.rowToClient(row);
        const updated: Client = { ...existing, ...data };
        const rowNumber = i + 1;
        await this.client.updateSheetRow(`CLIENTS!A${rowNumber}:J${rowNumber}`, this.clientToRow(updated));
        return updated;
      }
    }
    return null;
  }
}

// 3. DOCUMENT_REQUIREMENTS
export class GoogleSheetsDocumentRequirementRepository implements IDocumentRequirementRepository {
  constructor(private client: GoogleSheetsClient = googleSheetsClient) {}

  private rowToRequirement(row: any[]): DocumentRequirement {
    return {
      requirement_id: toStr(row[0]),
      firm_id: toStr(row[1]),
      client_id: toStr(row[2]),
      document_type: toStr(row[3]) as DocumentType,
      frequency: toStr(row[4]) as 'Monthly' | 'Quarterly' | 'Annual' | 'Ad-hoc',
      due_day: toNum(row[5], 10),
      active: toBool(row[6]),
      created_at: toStr(row[7])
    };
  }

  private requirementToRow(r: DocumentRequirement): any[] {
    return [
      r.requirement_id,
      r.firm_id,
      r.client_id,
      r.document_type,
      r.frequency,
      r.due_day,
      r.active ? 'TRUE' : 'FALSE',
      r.created_at
    ];
  }

  async findByClient(firm_id: string, client_id: string): Promise<DocumentRequirement[]> {
    const rows = await this.client.getSheetValues('DOCUMENT_REQUIREMENTS!A:H');
    const reqs: DocumentRequirement[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'requirement_id') && toStr(row[1]) === firm_id && toStr(row[2]) === client_id && toBool(row[6])) {
        reqs.push(this.rowToRequirement(row));
      }
    }
    return reqs;
  }

  async findAll(firm_id: string): Promise<DocumentRequirement[]> {
    const rows = await this.client.getSheetValues('DOCUMENT_REQUIREMENTS!A:H');
    const reqs: DocumentRequirement[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'requirement_id') && toStr(row[1]) === firm_id) {
        reqs.push(this.rowToRequirement(row));
      }
    }
    return reqs;
  }

  async create(requirement: DocumentRequirement): Promise<DocumentRequirement> {
    await this.client.appendSheetRow('DOCUMENT_REQUIREMENTS', this.requirementToRow(requirement));
    return requirement;
  }
}

// 4. PERIOD_REQUIREMENTS
export class GoogleSheetsPeriodRequirementRepository implements IPeriodRequirementRepository {
  constructor(private client: GoogleSheetsClient = googleSheetsClient) {}

  private rowToPeriodRequirement(row: any[]): PeriodRequirement {
    return {
      period_requirement_id: toStr(row[0]),
      firm_id: toStr(row[1]),
      client_id: toStr(row[2]),
      document_type: toStr(row[3]) as DocumentType,
      period: toStr(row[4]),
      status: toStr(row[5]) as PeriodRequirementStatus,
      reason: toStr(row[6]) || undefined,
      updated_by: toStr(row[7]),
      updated_at: toStr(row[8])
    };
  }

  private periodRequirementToRow(p: PeriodRequirement): any[] {
    return [
      p.period_requirement_id,
      p.firm_id,
      p.client_id,
      p.document_type,
      p.period,
      p.status,
      p.reason || '',
      p.updated_by || '',
      p.updated_at
    ];
  }

  async findByClientAndPeriod(firm_id: string, client_id: string, period: string): Promise<PeriodRequirement[]> {
    const rows = await this.client.getSheetValues('PERIOD_REQUIREMENTS!A:I');
    const items: PeriodRequirement[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'period_requirement_id') && toStr(row[1]) === firm_id && toStr(row[2]) === client_id && toStr(row[4]) === period) {
        items.push(this.rowToPeriodRequirement(row));
      }
    }
    return items;
  }

  async findOverride(firm_id: string, client_id: string, document_type: string, period: string): Promise<PeriodRequirement | null> {
    const rows = await this.client.getSheetValues('PERIOD_REQUIREMENTS!A:I');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (
        isDataRow(row, 'period_requirement_id') && 
        toStr(row[1]) === firm_id && 
        toStr(row[2]) === client_id && 
        toStr(row[3]).toLowerCase() === document_type.toLowerCase() && 
        toStr(row[4]) === period
      ) {
        return this.rowToPeriodRequirement(row);
      }
    }
    return null;
  }

  async findAll(firm_id: string): Promise<PeriodRequirement[]> {
    const rows = await this.client.getSheetValues('PERIOD_REQUIREMENTS!A:I');
    const items: PeriodRequirement[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'period_requirement_id') && toStr(row[1]) === firm_id) {
        items.push(this.rowToPeriodRequirement(row));
      }
    }
    return items;
  }

  async upsert(override: PeriodRequirement): Promise<PeriodRequirement> {
    const rows = await this.client.getSheetValues('PERIOD_REQUIREMENTS!A:I');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (
        isDataRow(row, 'period_requirement_id') && 
        toStr(row[1]) === override.firm_id && 
        toStr(row[2]) === override.client_id && 
        toStr(row[3]).toLowerCase() === override.document_type.toLowerCase() && 
        toStr(row[4]) === override.period
      ) {
        const rowNumber = i + 1;
        await this.client.updateSheetRow(`PERIOD_REQUIREMENTS!A${rowNumber}:I${rowNumber}`, this.periodRequirementToRow(override));
        return override;
      }
    }
    await this.client.appendSheetRow('PERIOD_REQUIREMENTS', this.periodRequirementToRow(override));
    return override;
  }
}

// 5. DOCUMENTS
export class GoogleSheetsDocumentRepository implements IDocumentRepository {
  constructor(private client: GoogleSheetsClient = googleSheetsClient) {}

  private rowToDocument(row: any[]): Document {
    return {
      document_id: toStr(row[0]),
      firm_id: toStr(row[1]),
      client_id: toStr(row[2]),
      document_type: toStr(row[3]) as DocumentType,
      period: toStr(row[4]),
      filename: toStr(row[5]),
      email_id: toStr(row[6]),
      sender_email: toStr(row[7]),
      received_at: toStr(row[8]),
      drive_file_id: toStr(row[9]) || undefined,
      processing_status: toStr(row[10]) as ProcessingStatus,
      validation_status: toStr(row[11]) as ValidationStatus,
      ai_confidence: toNum(row[12], 0),
      created_at: toStr(row[13]),
      notes: toStr(row[14]) || undefined
    };
  }

  private documentToRow(d: Document): any[] {
    return [
      d.document_id,
      d.firm_id,
      d.client_id,
      d.document_type,
      d.period,
      d.filename,
      d.email_id || '',
      d.sender_email || '',
      d.received_at,
      d.drive_file_id || '',
      d.processing_status,
      d.validation_status,
      d.ai_confidence !== undefined ? String(d.ai_confidence) : '0',
      d.created_at,
      d.notes || ''
    ];
  }

  async findById(firm_id: string, document_id: string): Promise<Document | null> {
    const rows = await this.client.getSheetValues('DOCUMENTS!A:O');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'document_id') && toStr(row[0]) === document_id && toStr(row[1]) === firm_id) {
        return this.rowToDocument(row);
      }
    }
    return null;
  }

  async findAll(firm_id: string): Promise<Document[]> {
    const rows = await this.client.getSheetValues('DOCUMENTS!A:O');
    const docs: Document[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'document_id') && toStr(row[1]) === firm_id) {
        docs.push(this.rowToDocument(row));
      }
    }
    return docs;
  }

  async findByClientAndPeriod(firm_id: string, client_id: string, period: string): Promise<Document[]> {
    const rows = await this.client.getSheetValues('DOCUMENTS!A:O');
    const docs: Document[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'document_id') && toStr(row[1]) === firm_id && toStr(row[2]) === client_id && toStr(row[4]) === period) {
        docs.push(this.rowToDocument(row));
      }
    }
    return docs;
  }

  async findExisting(firm_id: string, client_id: string, document_type: string, period: string): Promise<Document | null> {
    const rows = await this.client.getSheetValues('DOCUMENTS!A:O');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (
        isDataRow(row, 'document_id') && 
        toStr(row[1]) === firm_id && 
        toStr(row[2]) === client_id && 
        toStr(row[3]).toLowerCase() === document_type.toLowerCase() && 
        toStr(row[4]) === period
      ) {
        return this.rowToDocument(row);
      }
    }
    return null;
  }

  async findByEmailOrHash(firm_id: string, email_id?: string, file_hash?: string, filename?: string): Promise<Document | null> {
    const rows = await this.client.getSheetValues('DOCUMENTS!A:O');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'document_id') && toStr(row[1]) === firm_id) {
        if (email_id && filename && toStr(row[6]) === email_id && toStr(row[5]) === filename) {
          return this.rowToDocument(row);
        }
      }
    }
    return null;
  }

  async create(document: Document): Promise<Document> {
    await this.client.appendSheetRow('DOCUMENTS', this.documentToRow(document));
    return document;
  }

  async update(firm_id: string, document_id: string, data: Partial<Document>): Promise<Document | null> {
    const rows = await this.client.getSheetValues('DOCUMENTS!A:O');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'document_id') && toStr(row[0]) === document_id && toStr(row[1]) === firm_id) {
        const existing = this.rowToDocument(row);
        const updated: Document = { ...existing, ...data };
        const rowNumber = i + 1;
        await this.client.updateSheetRow(`DOCUMENTS!A${rowNumber}:O${rowNumber}`, this.documentToRow(updated));
        return updated;
      }
    }
    return null;
  }
}

// 6. ALERTS
export class GoogleSheetsAlertRepository implements IAlertRepository {
  constructor(private client: GoogleSheetsClient = googleSheetsClient) {}

  private rowToAlert(row: any[]): Alert {
    return {
      alert_id: toStr(row[0]),
      firm_id: toStr(row[1]),
      client_id: toStr(row[2]),
      document_type: toStr(row[3]) as DocumentType,
      period: toStr(row[4]),
      alert_type: toStr(row[5]) as AlertType,
      severity: toStr(row[6]) as AlertSeverity,
      message: toStr(row[7]),
      status: toStr(row[8]) as AlertStatus,
      created_at: toStr(row[9]),
      resolved_at: toStr(row[10]) || null,
      assigned_to: toStr(row[11])
    };
  }

  private alertToRow(a: Alert): any[] {
    return [
      a.alert_id,
      a.firm_id,
      a.client_id,
      a.document_type,
      a.period,
      a.alert_type,
      a.severity,
      a.message,
      a.status,
      a.created_at,
      a.resolved_at || '',
      a.assigned_to || ''
    ];
  }

  async findById(firm_id: string, alert_id: string): Promise<Alert | null> {
    const rows = await this.client.getSheetValues('ALERTS!A:L');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'alert_id') && toStr(row[0]) === alert_id && toStr(row[1]) === firm_id) {
        return this.rowToAlert(row);
      }
    }
    return null;
  }

  async findAll(firm_id: string): Promise<Alert[]> {
    const rows = await this.client.getSheetValues('ALERTS!A:L');
    const alerts: Alert[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'alert_id') && toStr(row[1]) === firm_id) {
        alerts.push(this.rowToAlert(row));
      }
    }
    return alerts;
  }

  async findOpenByClientAndDoc(firm_id: string, client_id: string, document_type: string, period: string, alert_type?: string): Promise<Alert | null> {
    const rows = await this.client.getSheetValues('ALERTS!A:L');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (
        isDataRow(row, 'alert_id') && 
        toStr(row[1]) === firm_id && 
        toStr(row[2]) === client_id && 
        toStr(row[3]).toLowerCase() === document_type.toLowerCase() && 
        toStr(row[4]) === period && 
        toStr(row[8]) === 'Open' && 
        (!alert_type || toStr(row[5]) === alert_type)
      ) {
        return this.rowToAlert(row);
      }
    }
    return null;
  }

  async create(alert: Alert): Promise<Alert> {
    await this.client.appendSheetRow('ALERTS', this.alertToRow(alert));
    return alert;
  }

  async update(firm_id: string, alert_id: string, data: Partial<Alert>): Promise<Alert | null> {
    const rows = await this.client.getSheetValues('ALERTS!A:L');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'alert_id') && toStr(row[0]) === alert_id && toStr(row[1]) === firm_id) {
        const existing = this.rowToAlert(row);
        const updated: Alert = { ...existing, ...data };
        const rowNumber = i + 1;
        await this.client.updateSheetRow(`ALERTS!A${rowNumber}:L${rowNumber}`, this.alertToRow(updated));
        return updated;
      }
    }
    return null;
  }
}

// 7. REMINDERS
export class GoogleSheetsReminderRepository implements IReminderRepository {
  constructor(private client: GoogleSheetsClient = googleSheetsClient) {}

  private rowToReminder(row: any[]): Reminder {
    return {
      reminder_id: toStr(row[0]),
      firm_id: toStr(row[1]),
      client_id: toStr(row[2]),
      document_type: toStr(row[3]) as DocumentType,
      period: toStr(row[4]),
      recipient_email: toStr(row[5]),
      subject: toStr(row[6]),
      body: toStr(row[7]),
      status: toStr(row[8]) as ReminderStatus,
      created_at: toStr(row[9]),
      sent_at: toStr(row[10]) || null,
      approved_by: toStr(row[11]) || null
    };
  }

  private reminderToRow(r: Reminder): any[] {
    return [
      r.reminder_id,
      r.firm_id,
      r.client_id,
      r.document_type,
      r.period,
      r.recipient_email,
      r.subject,
      r.body,
      r.status,
      r.created_at,
      r.sent_at || '',
      r.approved_by || ''
    ];
  }

  async findById(firm_id: string, reminder_id: string): Promise<Reminder | null> {
    const rows = await this.client.getSheetValues('REMINDERS!A:L');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'reminder_id') && toStr(row[0]) === reminder_id && toStr(row[1]) === firm_id) {
        return this.rowToReminder(row);
      }
    }
    return null;
  }

  async findAll(firm_id: string): Promise<Reminder[]> {
    const rows = await this.client.getSheetValues('REMINDERS!A:L');
    const reminders: Reminder[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'reminder_id') && toStr(row[1]) === firm_id) {
        reminders.push(this.rowToReminder(row));
      }
    }
    return reminders;
  }

  async create(reminder: Reminder): Promise<Reminder> {
    await this.client.appendSheetRow('REMINDERS', this.reminderToRow(reminder));
    return reminder;
  }

  async update(firm_id: string, reminder_id: string, data: Partial<Reminder>): Promise<Reminder | null> {
    const rows = await this.client.getSheetValues('REMINDERS!A:L');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'reminder_id') && toStr(row[0]) === reminder_id && toStr(row[1]) === firm_id) {
        const existing = this.rowToReminder(row);
        const updated: Reminder = { ...existing, ...data };
        const rowNumber = i + 1;
        await this.client.updateSheetRow(`REMINDERS!A${rowNumber}:L${rowNumber}`, this.reminderToRow(updated));
        return updated;
      }
    }
    return null;
  }
}

// 8. AUDIT_LOG
export class GoogleSheetsAuditLogRepository implements IAuditLogRepository {
  constructor(private client: GoogleSheetsClient = googleSheetsClient) {}

  private rowToAuditLog(row: any[]): AuditLog {
    return {
      log_id: toStr(row[0]),
      firm_id: toStr(row[1]),
      timestamp: toStr(row[2]),
      user: toStr(row[3]),
      action: toStr(row[4]),
      entity_type: toStr(row[5]),
      entity_id: toStr(row[6]),
      old_value: toStr(row[7]) || null,
      new_value: toStr(row[8]) || null,
      reason: toStr(row[9]) || null
    };
  }

  private auditLogToRow(l: AuditLog): any[] {
    return [
      l.log_id,
      l.firm_id,
      l.timestamp,
      l.user,
      l.action,
      l.entity_type,
      l.entity_id,
      l.old_value || '',
      l.new_value || '',
      l.reason || ''
    ];
  }

  async findAll(firm_id: string): Promise<AuditLog[]> {
    const rows = await this.client.getSheetValues('AUDIT_LOG!A:J');
    const logs: AuditLog[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'log_id') && toStr(row[1]) === firm_id) {
        logs.push(this.rowToAuditLog(row));
      }
    }
    return logs;
  }

  async append(log: AuditLog): Promise<AuditLog> {
    await this.client.appendSheetRow('AUDIT_LOG', this.auditLogToRow(log));
    return log;
  }
}

// 9. SETTINGS
export class GoogleSheetsSettingRepository implements ISettingRepository {
  constructor(private client: GoogleSheetsClient = googleSheetsClient) {}

  private rowToSetting(row: any[]): Setting {
    return {
      setting_id: toStr(row[0]),
      firm_id: toStr(row[1]),
      category: toStr(row[2]) as 'AI' | 'Compliance' | 'Notifications' | 'System',
      setting_key: toStr(row[3]),
      setting_value: toStr(row[4]),
      description: toStr(row[5]),
      active: toBool(row[6]),
      updated_at: toStr(row[7])
    };
  }

  private settingToRow(s: Setting): any[] {
    return [
      s.setting_id,
      s.firm_id,
      s.category,
      s.setting_key,
      s.setting_value,
      s.description,
      s.active ? 'TRUE' : 'FALSE',
      s.updated_at
    ];
  }

  async findByKey(firm_id: string, setting_key: string): Promise<Setting | null> {
    const rows = await this.client.getSheetValues('SETTINGS!A:H');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'setting_id') && toStr(row[1]) === firm_id && toStr(row[3]) === setting_key && toBool(row[6])) {
        return this.rowToSetting(row);
      }
    }
    return null;
  }

  async findAll(firm_id: string): Promise<Setting[]> {
    const rows = await this.client.getSheetValues('SETTINGS!A:H');
    const settings: Setting[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'setting_id') && toStr(row[1]) === firm_id) {
        settings.push(this.rowToSetting(row));
      }
    }
    return settings;
  }

  async update(firm_id: string, setting_key: string, setting_value: string, _updated_by?: string): Promise<Setting | null> {
    const rows = await this.client.getSheetValues('SETTINGS!A:H');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (isDataRow(row, 'setting_id') && toStr(row[1]) === firm_id && toStr(row[3]) === setting_key) {
        const existing = this.rowToSetting(row);
        const updated: Setting = {
          ...existing,
          setting_value,
          updated_at: new Date().toISOString()
        };
        const rowNumber = i + 1;
        await this.client.updateSheetRow(`SETTINGS!A${rowNumber}:H${rowNumber}`, this.settingToRow(updated));
        return updated;
      }
    }
    return null;
  }
}

// Unit of work implementation for Google Sheets
export class GoogleSheetsUnitOfWork implements IUnitOfWork {
  firms: IFirmRepository;
  clients: IClientRepository;
  documentRequirements: IDocumentRequirementRepository;
  periodRequirements: IPeriodRequirementRepository;
  documents: IDocumentRepository;
  alerts: IAlertRepository;
  reminders: IReminderRepository;
  auditLogs: IAuditLogRepository;
  settings: ISettingRepository;

  constructor(client: GoogleSheetsClient = googleSheetsClient) {
    this.firms = new GoogleSheetsFirmRepository(client);
    this.clients = new GoogleSheetsClientRepository(client);
    this.documentRequirements = new GoogleSheetsDocumentRequirementRepository(client);
    this.periodRequirements = new GoogleSheetsPeriodRequirementRepository(client);
    this.documents = new GoogleSheetsDocumentRepository(client);
    this.alerts = new GoogleSheetsAlertRepository(client);
    this.reminders = new GoogleSheetsReminderRepository(client);
    this.auditLogs = new GoogleSheetsAuditLogRepository(client);
    this.settings = new GoogleSheetsSettingRepository(client);
  }
}
