import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryUnitOfWork, getInitialSeedData } from '../src/repositories/memoryRepo.js';
import { ClientMatchingService } from '../src/services/clientMatchingService.js';
import { DocumentService } from '../src/services/documentService.js';
import { ComplianceEngine } from '../src/services/complianceEngine.js';
import { ReminderService } from '../src/services/reminderService.js';
import { AlertService } from '../src/services/alertService.js';
import { SettingsService } from '../src/services/settingsService.js';
import { AuditService } from '../src/services/auditService.js';

describe('CA Copilot Core Business Rules & Services', () => {
  let uow: MemoryUnitOfWork;
  const FIRM_ID = 'FIR-001';

  beforeEach(() => {
    uow = new MemoryUnitOfWork(getInitialSeedData());
  });

  describe('1. Client Matching', () => {
    it('matches known client primary_email deterministically', async () => {
      const matcher = new ClientMatchingService(uow);
      const client = await matcher.matchClientByEmail(FIRM_ID, 'finance@acmeglobal.com');
      expect(client).not.toBeNull();
      expect(client?.client_id).toBe('CLI-001');
      expect(client?.legal_name).toBe('Acme Global Pvt Ltd');
    });

    it('returns null for unknown client email and does not guess', async () => {
      const matcher = new ClientMatchingService(uow);
      const client = await matcher.matchClientByEmail(FIRM_ID, 'unregistered_person@randomcorp.com');
      expect(client).toBeNull();
    });
  });

  describe('2. AI Extraction Confidence Triage (Configurable Settings)', () => {
    it('marks document Valid and Processed when confidence >= 0.95', async () => {
      const docService = new DocumentService(uow);
      const result = await docService.processIntakeDocument(FIRM_ID, {
        sender_email: 'finance@acmeglobal.com',
        filename: 'Sales_Register_Aug_New.xlsx',
        email_id: 'EML-991',
        ai_extracted: {
          client_company_name: 'Acme Global',
          document_type: 'Payroll Summary',
          applicable_period: '2026-08'
        },
        ai_confidence: 0.96
      });

      expect(result.document.validation_status).toBe('Valid');
      expect(result.document.processing_status).toBe('Processed');
      expect(result.isUnknownClient).toBe(false);
      expect(result.isDuplicate).toBe(false);
    });

    it('marks document Review Required when confidence is between 0.80 and 0.949', async () => {
      const docService = new DocumentService(uow);
      const result = await docService.processIntakeDocument(FIRM_ID, {
        sender_email: 'accounts@nexusfintech.io',
        filename: 'Bank_Statement_Aug.pdf',
        email_id: 'EML-992',
        ai_extracted: {
          client_company_name: 'Nexus FinTech',
          document_type: 'GST 3B Supporting',
          applicable_period: '2026-08'
        },
        ai_confidence: 0.86
      });

      expect(result.document.validation_status).toBe('Review Required');
      const alerts = await uow.alerts.findAll(FIRM_ID);
      const reviewAlert = alerts.find(a => a.client_id === 'CLI-002' && a.alert_type === 'Review Required');
      expect(reviewAlert).toBeDefined();
      expect(reviewAlert?.status).toBe('Open');
    });

    it('marks document Review Required and triggers High alert when confidence < 0.80', async () => {
      const docService = new DocumentService(uow);
      const result = await docService.processIntakeDocument(FIRM_ID, {
        sender_email: 'finance@acmeglobal.com',
        filename: 'Scanned_Doc.pdf',
        email_id: 'EML-993',
        ai_extracted: {
          document_type: 'Other',
          applicable_period: '2026-08'
        },
        ai_confidence: 0.65
      });

      expect(result.document.validation_status).toBe('Review Required');
      const alerts = await uow.alerts.findAll(FIRM_ID);
      const lowConfAlert = alerts.find(a => a.client_id === 'CLI-001' && a.severity === 'High' && a.alert_type === 'Review Required');
      expect(lowConfAlert).toBeDefined();
    });
  });

  describe('3. Unknown Client & Duplicate Detection', () => {
    it('creates Unknown Client alert when sender email is not registered', async () => {
      const docService = new DocumentService(uow);
      const result = await docService.processIntakeDocument(FIRM_ID, {
        sender_email: 'stranger@unknownbiz.com',
        filename: 'Invoice.pdf',
        ai_extracted: {
          client_company_name: 'Unknown Biz',
          document_type: 'Sales Register',
          applicable_period: '2026-08'
        },
        ai_confidence: 0.98
      });

      expect(result.isUnknownClient).toBe(true);
      expect(result.document.client_id).toBe('CLI-UNKNOWN');
      expect(result.document.validation_status).toBe('Review Required');

      const alerts = await uow.alerts.findAll(FIRM_ID);
      const unknownAlert = alerts.find(a => a.alert_type === 'Unknown Client');
      expect(unknownAlert).toBeDefined();
    });

    it('detects duplicate document for same client, type, and period', async () => {
      const docService = new DocumentService(uow);
      // Acme Sales Register for 2026-08 already exists in seed (DOC-001)
      const result = await docService.processIntakeDocument(FIRM_ID, {
        sender_email: 'finance@acmeglobal.com',
        filename: 'Acme_Sales_Aug2026_Resent.xlsx',
        email_id: 'EML-994',
        ai_extracted: {
          client_company_name: 'Acme Global',
          document_type: 'Sales Register',
          applicable_period: '2026-08'
        },
        ai_confidence: 0.98
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.document.validation_status).toBe('Review Required');

      const alerts = await uow.alerts.findAll(FIRM_ID);
      const dupAlert = alerts.find(a => a.client_id === 'CLI-001' && a.alert_type === 'Duplicate');
      expect(dupAlert).toBeDefined();
    });
  });

  describe('4. Period Requirements Override & Compliance Calculation', () => {
    it('applies "Not Required" period override and suppresses missing alert', async () => {
      const engine = new ComplianceEngine(uow);
      const { matrix } = await engine.evaluateCompliance(FIRM_ID, '2026-08');

      // CLI-004 Customs Duty Challan has PRQ-001 with status 'Not Required'
      const customsItem = matrix.find(m => m.client_id === 'CLI-004' && m.document_type === 'Customs Duty Challan');
      expect(customsItem).toBeDefined();
      expect(customsItem?.status).toBe('Not Required');
    });

    it('evaluates baseline requirement as Missing when not received and no override exists', async () => {
      const engine = new ComplianceEngine(uow);
      const { matrix, summary } = await engine.evaluateCompliance(FIRM_ID, '2026-08');

      // Acme Global Purchase Register for 2026-08 has not been received
      const acmePurchase = matrix.find(m => m.client_id === 'CLI-001' && m.document_type === 'Purchase Register');
      expect(acmePurchase).toBeDefined();
      expect(acmePurchase?.status).toBe('Missing');
      expect(summary.missing).toBeGreaterThan(0);
    });
  });

  describe('5. Reminder State Machine & Human-in-the-Loop Safety Gate', () => {
    it('creates reminder in Pending Approval status', async () => {
      const reminderService = new ReminderService(uow);
      const rem = await reminderService.createReminder({
        firm_id: FIRM_ID,
        client_id: 'CLI-001',
        document_type: 'Payroll Register',
        period: '2026-08',
        recipient_email: 'finance@acmeglobal.com',
        subject: 'Payroll Register Pending',
        body: 'Please submit payroll register.'
      });

      expect(rem.status).toBe('Pending Approval');
      expect(rem.approved_by).toBeNull();
    });

    it('transitions to Approved when CA partner explicitly approves', async () => {
      const reminderService = new ReminderService(uow);
      const approved = await reminderService.approveReminder(FIRM_ID, 'REM-001', 'CA Senior Partner');
      expect(approved.status).toBe('Approved');
      expect(approved.approved_by).toBe('CA Senior Partner');
    });

    it('rejects dispatch if reminder is not Approved', async () => {
      const reminderService = new ReminderService(uow);
      // REM-002 is in Draft status
      await expect(reminderService.sendReminder(FIRM_ID, 'REM-002', 'CA Partner')).rejects.toThrow(
        'Cannot send reminder: Current status is "Draft". Reminder must be in "Approved" status before dispatch.'
      );
    });

    it('successfully sends approved reminder and updates status to Sent with audit record', async () => {
      const reminderService = new ReminderService(uow);
      await reminderService.approveReminder(FIRM_ID, 'REM-001', 'CA Partner');
      const sent = await reminderService.sendReminder(FIRM_ID, 'REM-001', 'CA Partner');

      expect(sent.status).toBe('Sent');
      expect(sent.sent_at).not.toBeNull();

      const logs = await uow.auditLogs.findAll(FIRM_ID);
      const sentLog = logs.find(l => l.action === 'REMINDER_SENT' && l.entity_id === 'REM-001');
      expect(sentLog).toBeDefined();
    });
  });

  describe('6. Append-Only Audit Trail & Multi-Tenancy Scoping', () => {
    it('appends audit log entries without mutation or deletion', async () => {
      const audit = new AuditService(uow);
      const initialCount = (await audit.getFirmLogs(FIRM_ID)).length;

      await audit.log({
        firm_id: FIRM_ID,
        user: 'CA Test User',
        action: 'CUSTOM_TEST_ACTION',
        entity_type: 'Test',
        entity_id: 'TST-001',
        new_value: { test: true }
      });

      const updatedLogs = await audit.getFirmLogs(FIRM_ID);
      expect(updatedLogs.length).toBe(initialCount + 1);
      expect(updatedLogs[updatedLogs.length - 1].action).toBe('CUSTOM_TEST_ACTION');
    });

    it('isolates data between different firms (Multi-Tenancy)', async () => {
      const clientService = new ClientMatchingService(uow);
      const firm1Clients = await clientService.getAllClients('FIR-001');
      const firm2Clients = await clientService.getAllClients('FIR-002');

      expect(firm1Clients.length).toBe(5);
      expect(firm2Clients.length).toBe(0); // No clients seeded for FIRM-002
    });
  });
});
