import { IUnitOfWork } from '../repositories/interfaces.js';
import { Document, DocumentType, ValidationStatus, ProcessingStatus } from '../types/domain.js';
import { DocumentIntakeWebhookPayload } from '../types/api.js';
import { ClientMatchingService } from './clientMatchingService.js';
import { AlertService } from './alertService.js';
import { AuditService } from './auditService.js';
import { SettingsService } from './settingsService.js';

export class DocumentService {
  private clientMatcher: ClientMatchingService;
  private alertService: AlertService;
  private auditService: AuditService;
  private settingsService: SettingsService;

  constructor(private uow: IUnitOfWork) {
    this.clientMatcher = new ClientMatchingService(uow);
    this.alertService = new AlertService(uow);
    this.auditService = new AuditService(uow);
    this.settingsService = new SettingsService(uow);
  }

  async getAllDocuments(firm_id: string): Promise<Document[]> {
    return this.uow.documents.findAll(firm_id);
  }

  async getDocumentById(firm_id: string, documentId: string): Promise<Document | null> {
    return this.uow.documents.findById(firm_id, documentId);
  }

  /**
   * Authoritative document intake processing pipeline
   */
  async processIntakeDocument(firm_id: string, payload: DocumentIntakeWebhookPayload): Promise<{
    document: Document;
    isDuplicate: boolean;
    isUnknownClient: boolean;
  }> {
    const config = await this.settingsService.getFirmConfig(firm_id);
    
    // 1. Check idempotency / message & file duplication
    if (payload.email_id || payload.file_hash) {
      const existingMsg = await this.uow.documents.findByEmailOrHash(
        firm_id, 
        payload.email_id, 
        payload.file_hash, 
        payload.filename
      );
      if (existingMsg) {
        return { document: existingMsg, isDuplicate: true, isUnknownClient: false };
      }
    }

    // 2. Deterministic Client Matching (Authoritative via sender_email)
    const client = await this.clientMatcher.matchClientByEmail(firm_id, payload.sender_email);
    const isUnknownClient = !client;
    const clientId = client ? client.client_id : 'CLI-UNKNOWN';

    // 3. Document details & Period
    const docType = (payload.ai_extracted?.document_type as DocumentType) || 'Other';
    const period = payload.ai_extracted?.applicable_period || '2026-08';
    const aiConfidence = typeof payload.ai_confidence === 'number' ? payload.ai_confidence : 0.85;

    let validationStatus: ValidationStatus = 'Pending';
    let processingStatus: ProcessingStatus = 'Processing';
    let reviewNotes = '';

    // 4. Duplicate Check (Existing document for same client, type, period)
    let isDuplicate = false;
    if (client) {
      const existingDoc = await this.uow.documents.findExisting(firm_id, clientId, docType, period);
      if (existingDoc) {
        isDuplicate = true;
        validationStatus = 'Review Required';
        reviewNotes = `Potential duplicate of existing document ${existingDoc.document_id} for ${period}.`;
        
        await this.alertService.createAlert({
          firm_id,
          client_id: clientId,
          document_type: docType,
          period,
          alert_type: 'Duplicate',
          severity: 'Medium',
          message: `Duplicate document received (${payload.filename}). Existing document ID: ${existingDoc.document_id}.`
        });
      }
    }

    // 5. Unknown Client Check
    if (isUnknownClient) {
      validationStatus = 'Review Required';
      reviewNotes = `Unmatched sender email: ${payload.sender_email}. No client registered with this primary email.`;
      
      await this.alertService.createAlert({
        firm_id,
        client_id: clientId,
        document_type: docType,
        period,
        alert_type: 'Unknown Client',
        severity: 'High',
        message: `Document received from unregistered email ${payload.sender_email}. Extracted client hint: "${payload.ai_extracted?.client_company_name || 'N/A'}".`
      });
    }

    // 6. Confidence Triage (Using dynamic SETTINGS thresholds)
    if (!isUnknownClient && !isDuplicate) {
      if (aiConfidence >= config.autoProcessConfidence) {
        // High confidence >= AUTO_PROCESS_CONFIDENCE (default 0.95)
        validationStatus = 'Valid';
        processingStatus = 'Processed';
      } else if (aiConfidence >= config.reviewConfidence) {
        // Medium confidence (0.80 <= confidence < 0.95)
        validationStatus = 'Review Required';
        reviewNotes = `AI confidence (${Math.round(aiConfidence * 100)}%) is below auto-process threshold (${Math.round(config.autoProcessConfidence * 100)}%). CA review required.`;
        
        await this.alertService.createAlert({
          firm_id,
          client_id: clientId,
          document_type: docType,
          period,
          alert_type: 'Review Required',
          severity: 'Medium',
          message: `AI extraction confidence for ${payload.filename} is ${Math.round(aiConfidence * 100)}%. Requires CA verification.`
        });
      } else {
        // Low confidence < REVIEW_CONFIDENCE (default 0.80)
        validationStatus = 'Review Required';
        reviewNotes = `Low AI extraction confidence (${Math.round(aiConfidence * 100)}%). Document quality or layout requires manual inspection.`;
        
        await this.alertService.createAlert({
          firm_id,
          client_id: clientId,
          document_type: docType,
          period,
          alert_type: 'Review Required',
          severity: 'High',
          message: `Low extraction confidence (${Math.round(aiConfidence * 100)}%) on ${payload.filename}. Manual intake required.`
        });
      }
    }

    const documentId = `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newDoc: Document = {
      document_id: documentId,
      firm_id,
      client_id: clientId,
      document_type: docType,
      period,
      filename: payload.filename,
      email_id: payload.email_id || `EML-${Date.now()}`,
      sender_email: payload.sender_email,
      received_at: payload.received_at || new Date().toISOString(),
      drive_file_id: payload.drive_file_id,
      processing_status: processingStatus,
      validation_status: validationStatus,
      ai_confidence: aiConfidence,
      file_hash: payload.file_hash,
      created_at: new Date().toISOString(),
      notes: reviewNotes || undefined,
      file_size: payload.file_size || '1.5 MB',
      email_subject: payload.email_subject || payload.filename
    };

    const saved = await this.uow.documents.create(newDoc);

    // Immutable Audit Log
    await this.auditService.log({
      firm_id,
      user: 'Make.com Ingestion Webhook',
      action: 'DOCUMENT_INGESTED',
      entity_type: 'Document',
      entity_id: documentId,
      new_value: {
        filename: newDoc.filename,
        client_id: clientId,
        document_type: docType,
        period,
        ai_confidence: aiConfidence,
        validation_status: validationStatus,
        processing_status: processingStatus
      },
      reason: reviewNotes || 'Automated document ingestion'
    });

    return { document: saved, isDuplicate, isUnknownClient };
  }

  /**
   * Human-in-the-loop Document Review Action (Approve / Reject / Reclassify)
   */
  async reviewDocument(
    firm_id: string,
    documentId: string,
    params: {
      action: 'approve' | 'reject' | 'reclassify';
      document_type?: string;
      period?: string;
      notes?: string;
      reviewed_by: string;
    }
  ): Promise<Document | null> {
    const doc = await this.uow.documents.findById(firm_id, documentId);
    if (!doc) return null;

    const oldState = { ...doc };
    let updates: Partial<Document> = {
      notes: params.notes ? `${doc.notes ? doc.notes + ' | ' : ''}${params.notes}` : doc.notes
    };

    if (params.action === 'approve') {
      updates.validation_status = 'Valid';
      updates.processing_status = 'Processed';

      // Resolve open Review Required alerts for this document
      const openAlert = await this.uow.alerts.findOpenByClientAndDoc(
        firm_id, 
        doc.client_id, 
        doc.document_type, 
        doc.period, 
        'Review Required'
      );
      if (openAlert) {
        await this.alertService.updateAlertStatus(
          firm_id, 
          openAlert.alert_id, 
          'Resolved', 
          params.reviewed_by, 
          'Resolved via CA document approval'
        );
      }
    } else if (params.action === 'reject') {
      updates.validation_status = 'Invalid';
      updates.processing_status = 'Failed';

      await this.alertService.createAlert({
        firm_id,
        client_id: doc.client_id,
        document_type: doc.document_type,
        period: doc.period,
        alert_type: 'Invalid Document',
        severity: 'High',
        message: `Document ${doc.filename} rejected by ${params.reviewed_by}. Reason: ${params.notes || 'Document invalid or unreadable.'}`
      });
    } else if (params.action === 'reclassify') {
      if (params.document_type) updates.document_type = params.document_type as DocumentType;
      if (params.period) updates.period = params.period;
      updates.validation_status = 'Valid';
      updates.processing_status = 'Processed';
    }

    const updated = await this.uow.documents.update(firm_id, documentId, updates);

    await this.auditService.log({
      firm_id,
      user: params.reviewed_by,
      action: `DOCUMENT_${params.action.toUpperCase()}`,
      entity_type: 'Document',
      entity_id: documentId,
      old_value: oldState,
      new_value: updated,
      reason: params.notes || `CA review action: ${params.action}`
    });

    return updated;
  }
}
