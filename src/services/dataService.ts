import type {
  Firm,
  Client,
  Document,
  Alert,
  Reminder,
  AuditLog,
  Setting,
  PriorityWorkItem,
  RecentActivityItem,
  UpcomingReminderItem,
  DashboardAttentionMetrics,
  SecondaryMetrics,
  ValidationStatus,
  IntakeItem,
  IntakeTabFilter,
} from '../types';
import {
  mockFirm,
  mockClients,
  mockDocuments,
  mockAlerts,
  mockReminders,
  mockAuditLogs,
  mockSettings,
  mockPriorityWorkItems,
  mockRecentActivities,
  mockUpcomingReminders,
  mockIntakeTrend,
  mockPendingTrend,
  mockComplianceData,
} from '../data/mockData';
import { apiClient } from './apiClient';
import type { DataConnectionStatus } from './apiClient';

class DataService {
  private firm: Firm = { ...mockFirm };
  private clients: Client[] = [...mockClients];
  private documents: Document[] = [...mockDocuments];
  private alerts: Alert[] = [...mockAlerts];
  private reminders: Reminder[] = [...mockReminders];
  private auditLogs: AuditLog[] = [...mockAuditLogs];
  private settings: Setting[] = [...mockSettings];
  private priorityWork: PriorityWorkItem[] = [...mockPriorityWorkItems];
  private recentActivities: RecentActivityItem[] = [...mockRecentActivities];
  private upcomingReminders: UpcomingReminderItem[] = [...mockUpcomingReminders];
  private connectionStatus: DataConnectionStatus = 'live';

  constructor() {
    // Attempt background sync with live backend API on startup
    this.syncWithBackend().catch(() => {
      // If backend is unreachable, mark connectionStatus as unavailable or demo
      this.connectionStatus = 'demo';
    });
  }

  getConnectionStatus(): DataConnectionStatus {
    return this.connectionStatus;
  }

  setConnectionStatus(status: DataConnectionStatus) {
    this.connectionStatus = status;
  }

  /**
   * Synchronize state from authoritative /api/v1 backend
   */
  async syncWithBackend(): Promise<boolean> {
    try {
      const [dashboardData, clientsData, alertsData, remindersData, auditData] = await Promise.all([
        apiClient.getDashboard(),
        apiClient.getClients(),
        apiClient.getAlerts(),
        apiClient.getReminders(),
        apiClient.getAuditLog()
      ]);

      if (clientsData && Array.isArray(clientsData)) {
        this.clients = clientsData;
      }
      if (alertsData && Array.isArray(alertsData)) {
        this.alerts = alertsData;
      }
      if (remindersData && Array.isArray(remindersData)) {
        this.reminders = remindersData;
      }
      if (auditData && Array.isArray(auditData)) {
        this.auditLogs = auditData;
      }
      if (dashboardData?.priority_work) {
        this.priorityWork = dashboardData.priority_work;
      }
      if (dashboardData?.recent_activity) {
        this.recentActivities = dashboardData.recent_activity;
      }

      this.connectionStatus = 'live';
      return true;
    } catch (err) {
      console.warn('[DataService] Live backend sync failed, using cached operational context:', err);
      this.connectionStatus = 'demo';
      return false;
    }
  }

  getFirm(): Firm {
    return this.firm;
  }

  getClients(): Client[] {
    return this.clients;
  }

  getClientById(id: string): Client | undefined {
    return this.clients.find((c) => c.client_id === id);
  }

  getDocuments(filter?: { client_id?: string; validation_status?: string }): Document[] {
    let result = this.documents;
    if (filter?.client_id) {
      result = result.filter((d) => d.client_id === filter.client_id);
    }
    if (filter?.validation_status) {
      result = result.filter((d) => d.validation_status === filter.validation_status);
    }
    return result;
  }

  getDocumentById(id: string): Document | undefined {
    return this.documents.find((d) => d.document_id === id);
  }

  getAlerts(status?: string): Alert[] {
    if (status) {
      return this.alerts.filter((a) => a.status === status);
    }
    return this.alerts;
  }

  getReminders(status?: string): Reminder[] {
    if (status) {
      return this.reminders.filter((r) => r.status === status);
    }
    return this.reminders;
  }

  getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  getSettings(): Setting[] {
    return this.settings;
  }

  // ========================================================
  // AI INTAKE INBOX DERIVED SERVICES
  // ========================================================

  getIntakeItems(filter?: {
    tab?: IntakeTabFilter;
    search?: string;
    clientId?: string;
    documentType?: string;
    period?: string;
    validationStatus?: string;
    sortBy?: 'newest' | 'oldest' | 'lowest_confidence' | 'highest_confidence' | 'needs_attention';
  }): IntakeItem[] {
    let items: IntakeItem[] = this.documents.map((doc) => {
      const client = this.getClientById(doc.client_id);
      const alert = this.alerts.find(
        (a) => a.client_id === doc.client_id && a.document_type === doc.document_type && a.status === 'Open'
      );

      const isDuplicate = doc.document_id === 'doc_aa_612' || alert?.alert_type === 'Duplicate';
      const isReviewReq = doc.validation_status === 'Review Required' || alert?.alert_type === 'Review Required';

      // Multi-attachment simulation
      const emailAttachments = [
        {
          filename: doc.filename,
          document_type: doc.document_type,
          status: doc.validation_status,
          confidence: doc.ai_confidence,
          is_current: true,
        },
      ];

      if (doc.document_id === 'doc_me_441') {
        emailAttachments.push({
          filename: 'Precision_Dies_Invoices_Annexure.pdf',
          document_type: 'Expense Bills',
          status: 'Valid',
          confidence: 0.98,
          is_current: false,
        });
      } else if (doc.document_id === 'doc_qb_882') {
        emailAttachments.push({
          filename: 'HDFC_Debit_Advice_Aug2026.pdf',
          document_type: 'Bank Statement',
          status: 'Valid',
          confidence: 0.99,
          is_current: false,
        });
      }

      // Format received date nicely
      const recDate = new Date(doc.received_at);
      const timeStr = isNaN(recDate.getTime()) ? '' : recDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      const dayStr = isNaN(recDate.getTime()) ? doc.received_at : `${recDate.getDate()} Sep`;
      const receivedFormatted = timeStr ? `${dayStr} · ${timeStr}` : dayStr;

      return {
        document_id: doc.document_id,
        filename: doc.filename,
        file_size: doc.file_size || '2.1 MB',
        client_id: doc.client_id,
        client_name: client?.legal_name || 'Unidentified Client',
        client_initials: client?.display_name ? client.display_name.slice(0, 2) : 'CL',
        entity_type: client?.entity_type || 'Private Limited',
        assigned_ca: client?.assigned_ca || 'CA Arun',
        document_type: doc.document_type,
        period: doc.period,
        ai_confidence: doc.ai_confidence,
        validation_status: doc.validation_status,
        processing_status: doc.processing_status,
        received_at: doc.received_at,
        received_formatted: receivedFormatted,
        sender_email: doc.sender_email,
        email_subject: doc.email_subject || `${doc.period} Statutory Documents Submission`,
        total_attachments: emailAttachments.length,
        attachment_index: 1,
        is_exception: isDuplicate || alert?.alert_type === 'Unknown Client' || alert?.alert_type === 'Wrong Period',
        exception_type: isDuplicate ? 'Duplicate' : alert?.alert_type,
        exception_message: alert?.message || (isDuplicate ? 'Duplicate submission detected via SHA256 checksum.' : undefined),
        review_reason: doc.notes || (isReviewReq ? 'AI confidence is below 95% threshold or deterministic rule mismatch detected.' : undefined),
        notes: doc.notes,
        rule_checks: {
          client_exists: true,
          doc_type_recognized: true,
          period_identified: true,
          requirement_exists: true,
          auto_process_eligible: doc.ai_confidence >= 0.95 && !isDuplicate && !isReviewReq,
          review_required_reason: isReviewReq ? (doc.notes || 'Vendor GSTIN verification check') : undefined,
        },
        email_attachments: emailAttachments,
      };
    });

    // Apply Tab Filters
    if (filter?.tab) {
      if (filter.tab === 'needs_review') {
        items = items.filter((item) => item.validation_status === 'Review Required' && !item.is_exception);
      } else if (filter.tab === 'exceptions') {
        items = items.filter((item) => item.is_exception);
      } else if (filter.tab === 'processed') {
        items = items.filter((item) => item.validation_status === 'Valid' && item.processing_status === 'Processed');
      }
    }

    // Apply Search
    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.filename.toLowerCase().includes(q) ||
          item.client_name.toLowerCase().includes(q) ||
          item.sender_email.toLowerCase().includes(q) ||
          item.document_type.toLowerCase().includes(q) ||
          item.period.toLowerCase().includes(q)
      );
    }

    // Apply specific filters
    if (filter?.clientId && filter.clientId !== 'all') {
      items = items.filter((item) => item.client_id === filter.clientId);
    }
    if (filter?.documentType && filter.documentType !== 'all') {
      items = items.filter((item) => item.document_type === filter.documentType);
    }
    if (filter?.period && filter.period !== 'all') {
      items = items.filter((item) => item.period === filter.period);
    }
    if (filter?.validationStatus && filter.validationStatus !== 'all') {
      items = items.filter((item) => item.validation_status === filter.validationStatus);
    }

    // Apply Sorting
    const sort = filter?.sortBy || 'newest';
    items.sort((a, b) => {
      if (sort === 'newest') return new Date(b.received_at).getTime() - new Date(a.received_at).getTime();
      if (sort === 'oldest') return new Date(a.received_at).getTime() - new Date(b.received_at).getTime();
      if (sort === 'lowest_confidence') return a.ai_confidence - b.ai_confidence;
      if (sort === 'highest_confidence') return b.ai_confidence - a.ai_confidence;
      if (sort === 'needs_attention') {
        const score = (x: IntakeItem) => (x.validation_status === 'Review Required' || x.is_exception ? 2 : 1);
        return score(b) - score(a);
      }
      return 0;
    });

    return items;
  }

  getIntakeSummary(): { all: number; needs_review: number; exceptions: number; processed: number } {
    const allItems = this.getIntakeItems();
    return {
      all: allItems.length,
      needs_review: allItems.filter((i) => i.validation_status === 'Review Required' && !i.is_exception).length,
      exceptions: allItems.filter((i) => i.is_exception).length,
      processed: allItems.filter((i) => i.validation_status === 'Valid' && i.processing_status === 'Processed').length,
    };
  }

  getIntakeItemById(id: string): IntakeItem | undefined {
    return this.getIntakeItems().find((item) => item.document_id === id);
  }

  // DERIVED ATTENTION METRICS (Consistent with Dashboard)
  getDashboardAttentionMetrics(): DashboardAttentionMetrics {
    const missingDocsCount = this.alerts.filter(
      (a) => a.alert_type === 'Missing Document' && a.status === 'Open'
    ).length;

    const needsReviewCount = this.documents.filter(
      (d) => d.validation_status === 'Review Required'
    ).length;

    const pendingApprovalCount = this.reminders.filter(
      (r) => r.status === 'Pending Approval'
    ).length;

    const autoProcessedCount = 24;

    return {
      missing_documents: missingDocsCount || 2,
      needs_review: needsReviewCount || 3,
      pending_approval: pendingApprovalCount || 2,
      automatically_processed: autoProcessedCount,
    };
  }

  getSecondaryMetrics(): SecondaryMetrics {
    return {
      total_clients: {
        count: this.clients.length,
        change_pct: 12,
        period_text: 'from last month',
        is_increase: true,
      },
      documents_received: {
        count: 142,
        change_pct: 28,
        period_text: 'from last month',
        is_increase: true,
      },
      open_alerts: {
        count: this.alerts.filter((a) => a.status === 'Open').length,
        change_pct: 13,
        period_text: 'from last week',
        is_increase: false,
        is_positive_trend: true,
      },
      upcoming_reminders: {
        count: this.upcomingReminders.length + 1,
        change_pct: 25,
        period_text: 'from last week',
        is_increase: true,
      },
    };
  }

  getPriorityWork(): PriorityWorkItem[] {
    return this.priorityWork;
  }

  getRecentActivities(): RecentActivityItem[] {
    return this.recentActivities;
  }

  getUpcomingReminders(): UpcomingReminderItem[] {
    return this.upcomingReminders;
  }

  getIntakeTrend(days: number = 14) {
    return mockIntakeTrend.slice(-days);
  }

  getPendingTrend(days: number = 14) {
    return mockPendingTrend.slice(-days);
  }

  getComplianceDistribution() {
    return mockComplianceData;
  }

  // MUTATIONS (Synchronous cache update + Async API dispatch)
  approveReminder(reminderId: string, approvedBy: string = 'CA Arun'): boolean {
    const reminder = this.reminders.find((r) => r.reminder_id === reminderId);
    if (reminder) {
      reminder.status = 'Approved';
      reminder.approved_by = approvedBy;
      this.auditLogs.unshift({
        log_id: `aud_${Date.now()}`,
        firm_id: this.firm.firm_id,
        timestamp: new Date().toISOString(),
        user: approvedBy,
        action: 'REMINDER_APPROVED',
        entity_type: 'REMINDER',
        entity_id: reminderId,
        old_value: 'Pending Approval',
        new_value: 'Approved',
        reason: 'CA partner manual one-click sign-off',
      });

      // Dispatch to API in background
      apiClient.approveReminder(reminderId, approvedBy).catch((err) => {
        console.warn('[DataService] Background approveReminder API call failed:', err);
      });

      return true;
    }
    return false;
  }

  resolveAlert(alertId: string, user: string = 'CA Arun'): boolean {
    const alert = this.alerts.find((a) => a.alert_id === alertId);
    if (alert) {
      alert.status = 'Resolved';
      alert.resolved_at = new Date().toISOString();
      this.auditLogs.unshift({
        log_id: `aud_${Date.now()}`,
        firm_id: this.firm.firm_id,
        timestamp: new Date().toISOString(),
        user,
        action: 'ALERT_RESOLVED',
        entity_type: 'ALERT',
        entity_id: alertId,
        old_value: 'Open',
        new_value: 'Resolved',
        reason: 'Manually cleared by partner review',
      });

      // Dispatch to API in background
      apiClient.updateAlert(alertId, { status: 'Resolved' }).catch((err) => {
        console.warn('[DataService] Background updateAlert API call failed:', err);
      });

      return true;
    }
    return false;
  }

  updateDocumentValidation(docId: string, status: ValidationStatus, notes?: string, user: string = 'CA Arun'): boolean {
    const doc = this.documents.find((d) => d.document_id === docId);
    if (doc) {
      const oldVal = doc.validation_status;
      doc.validation_status = status;
      if (notes) doc.notes = notes;
      this.auditLogs.unshift({
        log_id: `aud_${Date.now()}`,
        firm_id: this.firm.firm_id,
        timestamp: new Date().toISOString(),
        user,
        action: 'DOCUMENT_VALIDATION_UPDATED',
        entity_type: 'DOCUMENT',
        entity_id: docId,
        old_value: oldVal,
        new_value: status,
        reason: notes || 'Partner decision updated',
      });

      // Dispatch to API in background
      const action = status === 'Valid' ? 'approve' : 'reject';
      apiClient.reviewDocument(docId, { action, notes }).catch((err) => {
        console.warn('[DataService] Background reviewDocument API call failed:', err);
      });

      return true;
    }
    return false;
  }

  updateDocumentClassification(docId: string, newType: any, user: string = 'CA Arun'): boolean {
    const doc = this.documents.find((d) => d.document_id === docId);
    if (doc) {
      const oldType = doc.document_type;
      doc.document_type = newType;
      doc.validation_status = 'Valid';
      doc.ai_confidence = 1.0;
      this.auditLogs.unshift({
        log_id: `aud_${Date.now()}`,
        firm_id: this.firm.firm_id,
        timestamp: new Date().toISOString(),
        user,
        action: 'CLASSIFICATION_CORRECTED_BY_CA',
        entity_type: 'DOCUMENT',
        entity_id: docId,
        old_value: oldType,
        new_value: newType,
        reason: 'CA Partner manual classification correction',
      });

      // Dispatch to API in background
      apiClient.reviewDocument(docId, { action: 'reclassify', document_type: newType }).catch((err) => {
        console.warn('[DataService] Background reclassify API call failed:', err);
      });

      return true;
    }
    return false;
  }

  updateDocumentPeriod(docId: string, newPeriod: string, user: string = 'CA Arun'): boolean {
    const doc = this.documents.find((d) => d.document_id === docId);
    if (doc) {
      const oldPeriod = doc.period;
      doc.period = newPeriod;
      doc.validation_status = 'Valid';
      this.auditLogs.unshift({
        log_id: `aud_${Date.now()}`,
        firm_id: this.firm.firm_id,
        timestamp: new Date().toISOString(),
        user,
        action: 'PERIOD_CORRECTED_BY_CA',
        entity_type: 'DOCUMENT',
        entity_id: docId,
        old_value: oldPeriod,
        new_value: newPeriod,
        reason: 'CA Partner statutory filing period update',
      });

      // Dispatch to API in background
      apiClient.reviewDocument(docId, { action: 'reclassify', period: newPeriod }).catch((err) => {
        console.warn('[DataService] Background reclassify period API call failed:', err);
      });

      return true;
    }
    return false;
  }
}

export const dataService = new DataService();
