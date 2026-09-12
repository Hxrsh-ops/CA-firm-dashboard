import { IUnitOfWork } from '../repositories/interfaces.js';
import { 
  DashboardAttentionMetrics, 
  PriorityWorkItem, 
  RecentActivityItem, 
  SecondaryMetrics,
  IntakeItem,
  IntakeStats
} from '../types/api.js';
import { ComplianceEngine } from './complianceEngine.js';
import { SettingsService } from './settingsService.js';

export class DashboardService {
  private complianceEngine: ComplianceEngine;
  private settingsService: SettingsService;

  constructor(private uow: IUnitOfWork) {
    this.complianceEngine = new ComplianceEngine(uow);
    this.settingsService = new SettingsService(uow);
  }

  async getDashboardData(firm_id: string, period = '2026-08') {
    const clients = await this.uow.clients.findAll(firm_id);
    const documents = await this.uow.documents.findAll(firm_id);
    const alerts = await this.uow.alerts.findAll(firm_id);
    const reminders = await this.uow.reminders.findAll(firm_id);
    const { matrix, summary } = await this.complianceEngine.evaluateCompliance(firm_id, period);

    const clientMap = new Map(clients.map(c => [c.client_id, c]));

    // 1. Attention Metrics
    const missingDocsCount = matrix.filter(m => m.status === 'Missing').length;
    const needsReviewDocs = documents.filter(d => d.validation_status === 'Review Required').length;
    const pendingApprovalReminders = reminders.filter(r => r.status === 'Pending Approval').length;
    const automaticallyProcessed = documents.filter(d => d.processing_status === 'Processed' && d.validation_status === 'Valid').length;

    const attention_metrics: DashboardAttentionMetrics = {
      missing_documents: missingDocsCount,
      needs_review: needsReviewDocs,
      pending_approval: pendingApprovalReminders,
      automatically_processed: automaticallyProcessed
    };

    // 2. Priority Work Items
    const priority_work: PriorityWorkItem[] = [];

    // Add missing documents
    for (const item of matrix.filter(m => m.status === 'Missing')) {
      const client = clientMap.get(item.client_id);
      priority_work.push({
        id: `WORK-MIS-${item.client_id}-${item.document_type}`,
        client_id: item.client_id,
        client_name: item.client_name,
        client_initials: item.client_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        document_type: item.document_type,
        period: item.period,
        status: 'Missing',
        priority: 'High',
        assigned_to: client?.assigned_ca || 'CA Partner',
        due_date: item.due_date,
        action_hint: 'Generate Client Reminder'
      });
    }

    // Add review required documents
    for (const doc of documents.filter(d => d.validation_status === 'Review Required')) {
      const client = clientMap.get(doc.client_id);
      priority_work.push({
        id: `WORK-REV-${doc.document_id}`,
        client_id: doc.client_id,
        client_name: client?.display_name || doc.sender_email,
        client_initials: (client?.display_name || doc.sender_email).substring(0, 2).toUpperCase(),
        document_type: doc.document_type,
        period: doc.period,
        status: 'Needs Review',
        priority: 'Medium',
        assigned_to: client?.assigned_ca || 'CA Partner',
        due_date: doc.created_at.split('T')[0],
        action_hint: 'Review AI Extraction',
        context_id: doc.document_id
      });
    }

    // Add pending approval reminders
    for (const rem of reminders.filter(r => r.status === 'Pending Approval')) {
      const client = clientMap.get(rem.client_id);
      priority_work.push({
        id: `WORK-REM-${rem.reminder_id}`,
        client_id: rem.client_id,
        client_name: client?.display_name || rem.recipient_email,
        client_initials: (client?.display_name || rem.recipient_email).substring(0, 2).toUpperCase(),
        document_type: rem.document_type,
        period: rem.period,
        status: 'Pending Approval',
        priority: 'High',
        assigned_to: client?.assigned_ca || 'CA Partner',
        due_date: rem.created_at.split('T')[0],
        action_hint: 'Approve & Send Reminder',
        context_id: rem.reminder_id
      });
    }

    // 3. Recent Activity (from documents, alerts, reminders)
    const recent_activity: RecentActivityItem[] = [];

    for (const doc of documents.slice(-5).reverse()) {
      recent_activity.push({
        id: `ACT-${doc.document_id}`,
        title: `${doc.document_type} received`,
        subtitle: `${clientMap.get(doc.client_id)?.display_name || doc.sender_email} · ${doc.filename}`,
        time_ago: 'Recent',
        status: doc.validation_status === 'Valid' ? 'Processed' : 'Needs Review',
        type: 'document',
        document_id: doc.document_id
      });
    }

    // 4. Secondary Metrics
    const openAlertsCount = alerts.filter(a => a.status === 'Open').length;
    const upcomingRemindersCount = reminders.filter(r => r.status === 'Pending Approval' || r.status === 'Draft').length;

    const secondary_metrics: SecondaryMetrics = {
      total_clients: { count: clients.length, change_pct: 12, period_text: 'vs last month', is_increase: true },
      documents_received: { count: documents.length, change_pct: 8, period_text: 'vs last period', is_increase: true },
      open_alerts: { count: openAlertsCount, change_pct: -15, period_text: 'vs last week', is_increase: false, is_positive_trend: true },
      upcoming_reminders: { count: upcomingRemindersCount, change_pct: 5, period_text: 'pending action', is_increase: true }
    };

    return {
      attention_metrics,
      priority_work: priority_work.slice(0, 10),
      recent_activity: recent_activity.slice(0, 6),
      secondary_metrics,
      compliance_summary: summary
    };
  }

  async getInboxData(firm_id: string, tab: string = 'all', search?: string) {
    const documents = await this.uow.documents.findAll(firm_id);
    const clients = await this.uow.clients.findAll(firm_id);
    const alerts = await this.uow.alerts.findAll(firm_id);
    const requirements = await this.uow.documentRequirements.findAll(firm_id);
    const config = await this.settingsService.getFirmConfig(firm_id);

    const clientMap = new Map(clients.map(c => [c.client_id, c]));

    const items: IntakeItem[] = documents.map((doc, index) => {
      const client = clientMap.get(doc.client_id);
      const isUnknown = !client || doc.client_id === 'CLI-UNKNOWN';
      
      const openAlert = alerts.find(a => 
        (a.client_id === doc.client_id || (isUnknown && a.alert_type === 'Unknown Client')) &&
        a.document_type.toLowerCase() === doc.document_type.toLowerCase() &&
        a.status === 'Open'
      );

      const reqExists = client ? requirements.some(r => r.client_id === client.client_id && r.document_type.toLowerCase() === doc.document_type.toLowerCase()) : false;
      const isAutoEligible = !isUnknown && doc.ai_confidence >= config.autoProcessConfidence && !openAlert;

      const initials = isUnknown ? 'UN' : (client?.display_name || 'CL').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      return {
        document_id: doc.document_id,
        filename: doc.filename,
        file_size: doc.file_size || '2.0 MB',
        client_id: doc.client_id,
        client_name: isUnknown ? `Unknown Client (${doc.sender_email})` : (client?.display_name || 'Client'),
        client_initials: initials,
        entity_type: client?.entity_type || 'Private Limited',
        assigned_ca: client?.assigned_ca || 'CA Partner',
        document_type: doc.document_type,
        period: doc.period,
        ai_confidence: doc.ai_confidence,
        validation_status: doc.validation_status,
        processing_status: doc.processing_status,
        received_at: doc.received_at,
        received_formatted: doc.received_at.replace('T', ' ').substring(0, 16),
        sender_email: doc.sender_email,
        email_subject: doc.email_subject || doc.filename,
        total_attachments: 1,
        attachment_index: 1,
        is_exception: !!openAlert,
        exception_type: openAlert?.alert_type,
        exception_message: openAlert?.message,
        review_reason: doc.notes,
        notes: doc.notes,
        rule_checks: {
          client_exists: !isUnknown,
          doc_type_recognized: doc.document_type !== 'Other',
          period_identified: !!doc.period,
          requirement_exists: reqExists,
          auto_process_eligible: isAutoEligible,
          review_required_reason: doc.notes
        },
        email_attachments: [
          {
            filename: doc.filename,
            document_type: doc.document_type,
            status: doc.validation_status,
            confidence: doc.ai_confidence,
            is_current: true
          }
        ]
      };
    });

    const stats: IntakeStats = {
      all_count: items.length,
      needs_review_count: items.filter(i => i.validation_status === 'Review Required').length,
      exceptions_count: items.filter(i => i.is_exception).length,
      processed_count: items.filter(i => i.processing_status === 'Processed' && i.validation_status === 'Valid').length
    };

    let filteredItems = items;
    if (tab === 'needs_review') {
      filteredItems = items.filter(i => i.validation_status === 'Review Required');
    } else if (tab === 'exceptions') {
      filteredItems = items.filter(i => i.is_exception);
    } else if (tab === 'processed') {
      filteredItems = items.filter(i => i.processing_status === 'Processed' && i.validation_status === 'Valid');
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filteredItems = filteredItems.filter(i => 
        i.filename.toLowerCase().includes(q) ||
        i.client_name.toLowerCase().includes(q) ||
        i.document_type.toLowerCase().includes(q) ||
        i.sender_email.toLowerCase().includes(q) ||
        i.period.toLowerCase().includes(q)
      );
    }

    return {
      items: filteredItems,
      stats
    };
  }
}
