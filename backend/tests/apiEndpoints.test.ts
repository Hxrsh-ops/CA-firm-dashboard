import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { resetUnitOfWorkForTesting, MemoryUnitOfWork, getInitialSeedData } from '../src/repositories/index.js';
import { env } from '../src/config/env.js';

describe('CA Copilot API v1 HTTP Endpoints & Webhooks', () => {
  const FIRM_ID = 'FIR-001';

  beforeEach(() => {
    resetUnitOfWorkForTesting(new MemoryUnitOfWork(getInitialSeedData()));
  });

  describe('Health Check', () => {
    it('returns 200 and healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.system).toBe('CA Copilot API v1');
    });
  });

  describe('Clients API (/api/v1/clients)', () => {
    it('GET /api/v1/clients returns list of clients for firm', async () => {
      const res = await request(app)
        .get('/api/v1/clients')
        .set('x-firm-id', FIRM_ID);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(5);
    });

    it('GET /api/v1/clients/:id returns single client', async () => {
      const res = await request(app)
        .get('/api/v1/clients/CLI-001')
        .set('x-firm-id', FIRM_ID);

      expect(res.status).toBe(200);
      expect(res.body.data.client_id).toBe('CLI-001');
      expect(res.body.data.legal_name).toBe('Acme Global Pvt Ltd');
    });

    it('GET /api/v1/clients/:id returns 404 for non-existent client', async () => {
      const res = await request(app)
        .get('/api/v1/clients/CLI-NONEXISTENT')
        .set('x-firm-id', FIRM_ID);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CLIENT_NOT_FOUND');
    });
  });

  describe('Documents & Review API (/api/v1/documents)', () => {
    it('GET /api/v1/documents returns documents list', async () => {
      const res = await request(app)
        .get('/api/v1/documents')
        .set('x-firm-id', FIRM_ID);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    });

    it('POST /api/v1/documents/:id/review approves document', async () => {
      const res = await request(app)
        .post('/api/v1/documents/DOC-003/review')
        .set('x-firm-id', FIRM_ID)
        .send({
          action: 'approve',
          notes: 'Verified purchase register columns manually.',
          reviewed_by: 'CA Sneha Mehta'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.validation_status).toBe('Valid');
      expect(res.body.data.processing_status).toBe('Processed');
    });

    it('POST /api/v1/documents/:id/review rejects document and creates alert', async () => {
      const res = await request(app)
        .post('/api/v1/documents/DOC-004/review')
        .set('x-firm-id', FIRM_ID)
        .send({
          action: 'reject',
          notes: 'Document is for wrong period (July instead of August).',
          reviewed_by: 'CA Amit Verma'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.validation_status).toBe('Invalid');
      expect(res.body.data.processing_status).toBe('Failed');
    });
  });

  describe('Reminders & Approval Workflow API (/api/v1/reminders)', () => {
    it('POST /api/v1/reminders creates new reminder draft in Pending Approval', async () => {
      const res = await request(app)
        .post('/api/v1/reminders')
        .set('x-firm-id', FIRM_ID)
        .send({
          client_id: 'CLI-001',
          document_type: 'Payroll Register',
          period: '2026-08',
          recipient_email: 'finance@acmeglobal.com',
          subject: 'Payroll Register Notice',
          body: 'Please provide payroll register for August 2026.'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('Pending Approval');
    });

    it('POST /api/v1/reminders/:id/approve approves reminder', async () => {
      const res = await request(app)
        .post('/api/v1/reminders/REM-001/approve')
        .set('x-firm-id', FIRM_ID)
        .send({ approved_by: 'CA Managing Partner' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Approved');
      expect(res.body.data.approved_by).toBe('CA Managing Partner');
    });

    it('POST /api/v1/reminders/:id/send fails if reminder is not Approved', async () => {
      const res = await request(app)
        .post('/api/v1/reminders/REM-002/send')
        .set('x-firm-id', FIRM_ID);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(res.body.error.message).toContain('must be in "Approved" status');
    });

    it('POST /api/v1/reminders/:id/send succeeds after approval', async () => {
      await request(app)
        .post('/api/v1/reminders/REM-001/approve')
        .set('x-firm-id', FIRM_ID)
        .send({ approved_by: 'CA Partner' });

      const res = await request(app)
        .post('/api/v1/reminders/REM-001/send')
        .set('x-firm-id', FIRM_ID);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Sent');
      expect(res.body.data.sent_at).toBeDefined();
    });
  });

  describe('Dashboard & AI Inbox APIs', () => {
    it('GET /api/v1/dashboard returns aggregated metrics', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard')
        .set('x-firm-id', FIRM_ID);

      expect(res.status).toBe(200);
      expect(res.body.data.attention_metrics).toBeDefined();
      expect(res.body.data.attention_metrics.missing_documents).toBeGreaterThanOrEqual(0);
      expect(res.body.data.priority_work).toBeDefined();
      expect(res.body.data.secondary_metrics).toBeDefined();
      expect(res.body.data.compliance_summary).toBeDefined();
    });

    it('GET /api/v1/inbox returns intake items with rule checks and stats', async () => {
      const res = await request(app)
        .get('/api/v1/inbox?tab=all')
        .set('x-firm-id', FIRM_ID);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.stats).toBeDefined();
      expect(res.body.data.stats.all_count).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Append-Only Audit Log API (/api/v1/audit-log)', () => {
    it('GET /api/v1/audit-log returns historical audit logs', async () => {
      const res = await request(app)
        .get('/api/v1/audit-log')
        .set('x-firm-id', FIRM_ID);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Webhooks & Security (/api/v1/webhooks)', () => {
    it('rejects webhook requests with missing or invalid secret', async () => {
      const res = await request(app)
        .post('/api/v1/webhooks/document-intake')
        .set('x-firm-id', FIRM_ID)
        .send({
          sender_email: 'finance@acmeglobal.com',
          filename: 'test.pdf'
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_WEBHOOK_SECRET');
    });

    it('processes document intake webhook with valid secret', async () => {
      const res = await request(app)
        .post('/api/v1/webhooks/document-intake')
        .set('x-firm-id', FIRM_ID)
        .set('x-webhook-secret', env.WEBHOOK_SECRET)
        .send({
          email_id: 'EML-TEST-001',
          sender_email: 'finance@acmeglobal.com',
          filename: 'Acme_Payroll_Aug.pdf',
          ai_extracted: {
            client_company_name: 'Acme Global',
            document_type: 'Payroll Register',
            applicable_period: '2026-08'
          },
          ai_confidence: 0.98
        });

      expect(res.status).toBe(200);
      expect(res.body.data.document).toBeDefined();
      expect(res.body.data.document.client_id).toBe('CLI-001');
      expect(res.body.data.is_duplicate).toBe(false);
    });

    it('handles idempotent duplicate delivery safely', async () => {
      const payload = {
        email_id: 'EML-IDEMPOTENT-001',
        sender_email: 'finance@acmeglobal.com',
        filename: 'Idempotent_Doc.pdf',
        ai_extracted: {
          client_company_name: 'Acme Global',
          document_type: 'Bank Statement',
          applicable_period: '2026-08'
        },
        ai_confidence: 0.97
      };

      // First delivery
      const res1 = await request(app)
        .post('/api/v1/webhooks/document-intake')
        .set('x-firm-id', FIRM_ID)
        .set('x-webhook-secret', env.WEBHOOK_SECRET)
        .send(payload);
      expect(res1.status).toBe(200);

      // Repeated delivery (Make.com retry)
      const res2 = await request(app)
        .post('/api/v1/webhooks/document-intake')
        .set('x-firm-id', FIRM_ID)
        .set('x-webhook-secret', env.WEBHOOK_SECRET)
        .send(payload);
      expect(res2.status).toBe(200);
      expect(res2.body.data.is_duplicate).toBe(true);
    });
  });
});
