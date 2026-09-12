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

export interface IFirmRepository {
  findById(firm_id: string): Promise<Firm | null>;
  findAll(): Promise<Firm[]>;
}

export interface IClientRepository {
  findById(firm_id: string, client_id: string): Promise<Client | null>;
  findByEmail(firm_id: string, email: string): Promise<Client | null>;
  findAll(firm_id: string): Promise<Client[]>;
  create(client: Client): Promise<Client>;
  update(firm_id: string, client_id: string, data: Partial<Client>): Promise<Client | null>;
}

export interface IDocumentRequirementRepository {
  findByClient(firm_id: string, client_id: string): Promise<DocumentRequirement[]>;
  findAll(firm_id: string): Promise<DocumentRequirement[]>;
  create(requirement: DocumentRequirement): Promise<DocumentRequirement>;
}

export interface IPeriodRequirementRepository {
  findByClientAndPeriod(firm_id: string, client_id: string, period: string): Promise<PeriodRequirement[]>;
  findOverride(firm_id: string, client_id: string, document_type: string, period: string): Promise<PeriodRequirement | null>;
  findAll(firm_id: string): Promise<PeriodRequirement[]>;
  upsert(override: PeriodRequirement): Promise<PeriodRequirement>;
}

export interface IDocumentRepository {
  findById(firm_id: string, document_id: string): Promise<Document | null>;
  findAll(firm_id: string): Promise<Document[]>;
  findByClientAndPeriod(firm_id: string, client_id: string, period: string): Promise<Document[]>;
  findExisting(firm_id: string, client_id: string, document_type: string, period: string): Promise<Document | null>;
  findByEmailOrHash(firm_id: string, email_id?: string, file_hash?: string, filename?: string): Promise<Document | null>;
  create(document: Document): Promise<Document>;
  update(firm_id: string, document_id: string, data: Partial<Document>): Promise<Document | null>;
}

export interface IAlertRepository {
  findById(firm_id: string, alert_id: string): Promise<Alert | null>;
  findAll(firm_id: string): Promise<Alert[]>;
  findOpenByClientAndDoc(firm_id: string, client_id: string, document_type: string, period: string, alert_type?: string): Promise<Alert | null>;
  create(alert: Alert): Promise<Alert>;
  update(firm_id: string, alert_id: string, data: Partial<Alert>): Promise<Alert | null>;
}

export interface IReminderRepository {
  findById(firm_id: string, reminder_id: string): Promise<Reminder | null>;
  findAll(firm_id: string): Promise<Reminder[]>;
  create(reminder: Reminder): Promise<Reminder>;
  update(firm_id: string, reminder_id: string, data: Partial<Reminder>): Promise<Reminder | null>;
}

export interface IAuditLogRepository {
  findAll(firm_id: string): Promise<AuditLog[]>;
  append(log: AuditLog): Promise<AuditLog>;
}

export interface ISettingRepository {
  findByKey(firm_id: string, setting_key: string): Promise<Setting | null>;
  findAll(firm_id: string): Promise<Setting[]>;
  update(firm_id: string, setting_key: string, setting_value: string, updated_by?: string): Promise<Setting | null>;
}

export interface IUnitOfWork {
  firms: IFirmRepository;
  clients: IClientRepository;
  documentRequirements: IDocumentRequirementRepository;
  periodRequirements: IPeriodRequirementRepository;
  documents: IDocumentRepository;
  alerts: IAlertRepository;
  reminders: IReminderRepository;
  auditLogs: IAuditLogRepository;
  settings: ISettingRepository;
}
