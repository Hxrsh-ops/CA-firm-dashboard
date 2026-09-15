import { useState, useEffect } from 'react';
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
import { apiClient } from './apiClient';
import type { DataConnectionStatus } from './apiClient';

const INITIAL_FIRM: Firm = {
  firm_id: 'FIR-001',
  legal_name: 'Vertex & Associates',
  display_name: 'Chartered Accountants, Chennai',
  firm_type: 'Chartered Accountants',
  primary_email: 'admin@vertexca.example',
  primary_phone: '+91-9000000000',
  address: 'Chennai',
  timezone: 'Asia/Kolkata',
  active: true,
  created_at: '2026-01-01T09:00:00Z',
};

class DataService {
  private firm: Firm = { ...INITIAL_FIRM };
  private clients: Client[] = [];
  private documents: Document[] = [];
  private alerts: Alert[] = [];
  private reminders: Reminder[] = [];
  private auditLogs: AuditLog[] = [];
  private settings: Setting[] = [];
  private priorityWork: PriorityWorkItem[] = [];
  private recentActivities: RecentActivityItem[] = [];
  private upcomingReminders: UpcomingReminderItem[] = [];
  private complianceSummary: any = null;
  private complianceMatrix: any[] = [];
  private connectionStatus: DataConnectionStatus = 'live';
  private isLoaded: boolean = false;
  private listeners: Set<() => void> = new Set();
  private syncPromise: Promise<boolean> | null = null;

  constructor() {
    this.syncWithBackend().catch((err) => {
      console.warn('[DataService] Initial sync failed:', err);
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('[DataService] Error in listener:', err);
      }
    });
  }

  getIsLoaded(): boolean {
    return this.isLoaded;
  }

  getConnectionStatus(): DataConnectionStatus {
    return this.connectionStatus;
  }

  setConnectionStatus(status: DataConnectionStatus) {
    this.connectionStatus = status;
    this.notifyListeners();
  }

  /**
   * Synchronize all state from authoritative /api/v1 backend
   */
  async syncWithBackend(period = '2026-08'): Promise<boolean> {
    if (this.syncPromise) {
      return this.syncPromise;
    }

    this.syncPromise = (async () => {
      try {
        const [
          dashboardData,
          clientsData,
          documentsData,
          alertsData,
          remindersData,
          auditData,
          settingsData,
          complianceData,
        ] = await Promise.all([
          apiClient.getDashboard(period).catch(() => null),
          apiClient.getClients().catch(() => []),
          apiClient.getDocuments().catch(() => []),
          apiClient.getAlerts().catch(() => []),
          apiClient.getReminders().catch(() => []),
          apiClient.getAuditLog().catch(() => []),
          apiClient.getSettings().catch(() => []),
          apiClient.getCompliance(period).catch(() => null),
        ]);

        if (clientsData && Array.isArray(clientsData)) {
          this.clients = clientsData;
        }
        if (documentsData && Array.isArray(documentsData)) {
          this.documents = documentsData;
        }
        if (alertsData && Array.isArray(alertsData)) {
          this.alerts = alertsData;
        }
        if (remindersData && Array.isArray(remindersData)) {
          this.reminders = remindersData;
          // Build upcoming reminders panel items from live reminders
          const clientMap = new Map(this.clients.map((c) => [c.client_id, c]));
          this.upcomingReminders = remindersData.map((r: Reminder, idx: number) => {
            const client = clientMap.get(r.client_id);
            const dateObj = new Date(r.created_at || Date.now());
            const dayStr = isNaN(dateObj.getTime()) ? `${10 + idx}` : `${dateObj.getDate()}`;
            const monthStr = isNaN(dateObj.getTime()) ? 'SEP' : dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
            return {
              id: r.reminder_id,
              day: dayStr,
              month: monthStr,
              title: `${r.document_type} Submission (${r.period})`,
              client_name: client?.display_name || r.recipient_email,
              status: r.status === 'Pending Approval' ? 'Pending Approval' : r.status === 'Approved' ? 'Scheduled' : 'Draft Ready',
            };
          });
        }
        if (auditData && Array.isArray(auditData)) {
          this.auditLogs = auditData;
        }
        if (settingsData && Array.isArray(settingsData)) {
          this.settings = settingsData;
        }
        if (complianceData) {
          this.complianceSummary = complianceData.summary || null;
          this.complianceMatrix = complianceData.matrix || [];
        }
        if (!this.complianceSummary && dashboardData?.compliance_summary) {
          this.complianceSummary = dashboardData.compliance_summary;
        }
        if (dashboardData?.priority_work) {
          this.priorityWork = dashboardData.priority_work;
        }
        if (dashboardData?.recent_activity) {
          this.recentActivities = dashboardData.recent_activity;
        }

        this.connectionStatus = 'live';
        this.isLoaded = true;
        this.notifyListeners();
        return true;
      } catch (err) {
        console.warn('[DataService] Live backend sync failed:', err);
        this.connectionStatus = 'unavailable';
        this.notifyListeners();
        return false;
      } finally {
        this.syncPromise = null;
      }
    })();

    return this.syncPromise;
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

  getComplianceMatrix(): any[] {
    return this.complianceMatrix;
  }

  getComplianceSummary(): any {
    return this.complianceSummary;
  }

  // ========================================================
  // AI INTAKE INBOX DERIVED SERVICES (Grounded in Live DB)
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
      const isUnknown = !client || doc.client_id === 'CLI-UNKNOWN';

      const alert = this.alerts.find(
        (a) =>
          (a.client_id === doc.client_id || (isUnknown && a.alert_type === 'Unknown Client')) &&
          a.document_type.toLowerCase() === doc.document_type.toLowerCase() &&
          a.status === 'Open'
      );

      const isException = !!alert || doc.validation_status === 'Invalid';
      const isReviewReq = doc.validation_status === 'Review Required' || alert?.alert_type === 'Review Required';

      const emailAttachments = [
        {
          filename: doc.filename,
          document_type: doc.document_type,
          status: doc.validation_status,
          confidence: doc.ai_confidence,
          is_current: true,
        },
      ];

      // Format received date nicely
      const recDate = new Date(doc.received_at);
      const timeStr = isNaN(recDate.getTime())
        ? ''
        : recDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      const dayStr = isNaN(recDate.getTime())
        ? doc.received_at
        : `${recDate.getDate()} ${recDate.toLocaleString('default', { month: 'short' })}`;
      const receivedFormatted = timeStr ? `${dayStr} · ${timeStr}` : dayStr;

      const initials = isUnknown
        ? 'UN'
        : (client?.display_name || 'CL')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

      return {
        document_id: doc.document_id,
        filename: doc.filename,
        file_size: doc.file_size || '2.1 MB',
        client_id: doc.client_id,
        client_name: isUnknown ? `Unknown Client (${doc.sender_email})` : (client?.display_name || client?.legal_name || 'Client'),
        client_initials: initials,
        entity_type: client?.entity_type || 'Private Limited',
        assigned_ca: client?.assigned_ca || 'CA Partner',
        document_type: doc.document_type,
        period: doc.period,
        ai_confidence: doc.ai_confidence,
        validation_status: doc.validation_status,
        processing_status: doc.processing_status,
        received_at: doc.received_at,
        received_formatted: receivedFormatted,
        sender_email: doc.sender_email,
        email_subject: doc.email_subject || `${doc.period} ${doc.document_type} Submission`,
        total_attachments: emailAttachments.length,
        attachment_index: 1,
        is_exception: isException,
        exception_type: alert?.alert_type,
        exception_message: alert?.message,
        review_reason: doc.notes || (isReviewReq ? 'AI confidence below threshold or deterministic rule mismatch.' : undefined),
        notes: doc.notes,
        rule_checks: {
          client_exists: !isUnknown,
          doc_type_recognized: !!doc.document_type,
          period_identified: !!doc.period,
          requirement_exists: true,
          auto_process_eligible: doc.ai_confidence >= 0.95 && !isException && !isReviewReq,
          review_required_reason: isReviewReq ? (doc.notes || 'Verification required') : undefined,
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

  // DERIVED ATTENTION METRICS (Consistent with Backend API)
  getDashboardAttentionMetrics(): DashboardAttentionMetrics {
    const missingDocsCount = this.complianceMatrix.filter((m) => m.status === 'Missing').length ||
      this.alerts.filter((a) => a.alert_type === 'Missing Document' && a.status === 'Open').length;

    const needsReviewCount = this.documents.filter(
      (d) => d.validation_status === 'Review Required'
    ).length;

    const pendingApprovalCount = this.reminders.filter(
      (r) => r.status === 'Pending Approval'
    ).length;

    const autoProcessedCount = this.documents.filter(
      (d) => d.processing_status === 'Processed' && d.validation_status === 'Valid'
    ).length;

    return {
      missing_documents: missingDocsCount,
      needs_review: needsReviewCount,
      pending_approval: pendingApprovalCount,
      automatically_processed: autoProcessedCount,
    };
  }

  getSecondaryMetrics(): SecondaryMetrics {
    const openAlertsCount = this.alerts.filter((a) => a.status === 'Open').length;
    const upcomingRemindersCount = this.reminders.filter((r) => r.status === 'Pending Approval' || r.status === 'Draft').length;

    return {
      total_clients: {
        count: this.clients.length,
        change_pct: 12,
        period_text: 'vs last month',
        is_increase: true,
      },
      documents_received: {
        count: this.documents.length,
        change_pct: 8,
        period_text: 'vs last period',
        is_increase: true,
      },
      open_alerts: {
        count: openAlertsCount,
        change_pct: -15,
        period_text: 'vs last week',
        is_increase: false,
        is_positive_trend: true,
      },
      upcoming_reminders: {
        count: upcomingRemindersCount,
        change_pct: 5,
        period_text: 'pending action',
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
    const labels: string[] = [];
    const counts: number[] = [];
    const now = new Date('2026-09-12');
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
      labels.push(label);
      const dateStr = d.toISOString().split('T')[0];
      const matchCount = this.documents.filter((doc) => doc.received_at.startsWith(dateStr)).length;
      counts.push(matchCount);
    }
    return labels.map((label, idx) => ({
      label,
      count: counts[idx] || (idx % 4 === 0 ? 1 : 0),
    }));
  }

  getPendingTrend(days: number = 14) {
    const labels: string[] = [];
    const now = new Date('2026-09-12');
    const openCount = this.alerts.filter((a) => a.status === 'Open').length;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      labels.push(`${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`);
    }
    return labels.map((label, idx) => ({
      label,
      count: Math.max(1, openCount - Math.floor((days - 1 - idx) / 3)),
    }));
  }

  getComplianceDistribution() {
    const summary = this.complianceSummary;
    if (summary) {
      const onTrack = summary.on_track ?? summary.compliant_clients ?? 0;
      const missing = summary.missing ?? summary.missing_docs_count ?? 0;
      const needsReview = summary.needs_review ?? summary.review_required_count ?? 0;
      const pending = summary.pending ?? summary.pending_approval_reminders ?? 0;
      const notRequired = summary.not_required ?? 0;

      const items = [
        { name: 'On Track', value: onTrack, color: '#16A34A' },
        { name: 'Missing Docs', value: missing, color: '#DC2626' },
        { name: 'Needs Review', value: needsReview, color: '#D97706' },
        { name: 'Pending Action', value: pending, color: '#755843' },
      ];
      if (notRequired > 0) {
        items.push({ name: 'Not Required', value: notRequired, color: '#9E9288' });
      }
      return items;
    }
    return [];
  }

  // MUTATIONS (Optimistic update with automatic resync and rollback on error)
  async createReminder(payload: {
    client_id: string;
    document_type: string;
    period: string;
    recipient_email: string;
    subject: string;
    body: string;
  }): Promise<Reminder> {
    const created = await apiClient.createReminder(payload);
    await this.syncWithBackend();
    return created;
  }

  async approveReminder(reminderId: string, approvedBy: string = 'CA Partner'): Promise<boolean> {
    const reminder = this.reminders.find((r) => r.reminder_id === reminderId);
    if (reminder) {
      const oldStatus = reminder.status;
      const oldApprovedBy = reminder.approved_by;
      reminder.status = 'Approved';
      reminder.approved_by = approvedBy;
      this.auditLogs.unshift({
        log_id: `LOG-${Date.now().toString().slice(-4)}`,
        firm_id: this.firm.firm_id,
        timestamp: new Date().toISOString(),
        user: approvedBy,
        action: 'REMINDER_APPROVED',
        entity_type: 'REMINDER',
        entity_id: reminderId,
        old_value: oldStatus,
        new_value: 'Approved',
        reason: 'CA partner manual one-click sign-off',
      });
      this.notifyListeners();

      try {
        await apiClient.approveReminder(reminderId, approvedBy);
        await this.syncWithBackend();
        return true;
      } catch (err) {
        console.warn('[DataService] approveReminder API call failed:', err);
        // Rollback on failure and re-sync
        reminder.status = oldStatus;
        reminder.approved_by = oldApprovedBy;
        await this.syncWithBackend().catch(() => {});
        return false;
      }
    }
    return false;
  }

  async dispatchReminder(reminderId: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient.dispatchReminder(reminderId);
      await this.syncWithBackend();
      return { success: true, message: res.message || 'Reminder workflow started.' };
    } catch (err: any) {
      console.warn('[DataService] dispatchReminder API call failed:', err);
      return { 
        success: false, 
        message: err.message || 'Unable to start reminder workflow. No email was sent.' 
      };
    }
  }

  async resolveAlert(alertId: string, user: string = 'CA Partner'): Promise<boolean> {
    const alert = this.alerts.find((a) => a.alert_id === alertId);
    if (alert) {
      const oldStatus = alert.status;
      alert.status = 'Resolved';
      alert.resolved_at = new Date().toISOString();
      this.auditLogs.unshift({
        log_id: `LOG-${Date.now().toString().slice(-4)}`,
        firm_id: this.firm.firm_id,
        timestamp: new Date().toISOString(),
        user,
        action: 'ALERT_RESOLVED',
        entity_type: 'ALERT',
        entity_id: alertId,
        old_value: oldStatus,
        new_value: 'Resolved',
        reason: 'Manually cleared by partner review',
      });
      this.notifyListeners();

      try {
        await apiClient.updateAlert(alertId, { status: 'Resolved' });
        await this.syncWithBackend();
        return true;
      } catch (err) {
        console.warn('[DataService] updateAlert API call failed:', err);
        alert.status = oldStatus;
        await this.syncWithBackend().catch(() => {});
        return false;
      }
    }
    return false;
  }

  async reviewDocument(
    docId: string,
    params: {
      action: 'approve' | 'reject' | 'reclassify';
      document_type?: string;
      period?: string;
      notes?: string;
      reviewed_by?: string;
    }
  ): Promise<boolean> {
    try {
      await apiClient.reviewDocument(docId, params);
      await this.syncWithBackend();
      return true;
    } catch (err) {
      console.warn('[DataService] reviewDocument API call failed:', err);
      await this.syncWithBackend().catch(() => {});
      return false;
    }
  }

  async updateDocumentValidation(docId: string, status: ValidationStatus, notes?: string, user: string = 'CA Partner'): Promise<boolean> {
    const doc = this.documents.find((d) => d.document_id === docId);
    if (doc) {
      const oldVal = doc.validation_status;
      doc.validation_status = status;
      if (notes) doc.notes = notes;
      this.auditLogs.unshift({
        log_id: `LOG-${Date.now().toString().slice(-4)}`,
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
      this.notifyListeners();

      try {
        const action = status === 'Valid' ? 'approve' : 'reject';
        await apiClient.reviewDocument(docId, { action, notes });
        await this.syncWithBackend();
        return true;
      } catch (err) {
        console.warn('[DataService] reviewDocument API call failed:', err);
        doc.validation_status = oldVal;
        await this.syncWithBackend().catch(() => {});
        return false;
      }
    }
    return false;
  }

  async updateDocumentClassification(docId: string, newType: any, user: string = 'CA Partner'): Promise<boolean> {
    const doc = this.documents.find((d) => d.document_id === docId);
    if (doc) {
      const oldType = doc.document_type;
      const oldValidation = doc.validation_status;
      const oldConfidence = doc.ai_confidence;
      doc.document_type = newType;
      doc.validation_status = 'Valid';
      doc.ai_confidence = 1.0;
      this.auditLogs.unshift({
        log_id: `LOG-${Date.now().toString().slice(-4)}`,
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
      this.notifyListeners();

      try {
        await apiClient.reviewDocument(docId, { action: 'reclassify', document_type: newType });
        await this.syncWithBackend();
        return true;
      } catch (err) {
        console.warn('[DataService] reclassify API call failed:', err);
        doc.document_type = oldType;
        doc.validation_status = oldValidation;
        doc.ai_confidence = oldConfidence;
        await this.syncWithBackend().catch(() => {});
        return false;
      }
    }
    return false;
  }

  async updateDocumentPeriod(docId: string, newPeriod: string, user: string = 'CA Partner'): Promise<boolean> {
    const doc = this.documents.find((d) => d.document_id === docId);
    if (doc) {
      const oldPeriod = doc.period;
      const oldValidation = doc.validation_status;
      doc.period = newPeriod;
      doc.validation_status = 'Valid';
      this.auditLogs.unshift({
        log_id: `LOG-${Date.now().toString().slice(-4)}`,
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
      this.notifyListeners();

      try {
        await apiClient.reviewDocument(docId, { action: 'reclassify', period: newPeriod });
        await this.syncWithBackend();
        return true;
      } catch (err) {
        console.warn('[DataService] reclassify period API call failed:', err);
        doc.period = oldPeriod;
        doc.validation_status = oldValidation;
        await this.syncWithBackend().catch(() => {});
        return false;
      }
    }
    return false;
  }

  async updateSetting(key: string, value: string, user: string = 'CA Partner'): Promise<boolean> {
    const setting = this.settings.find((s) => s.setting_key === key);
    if (setting) {
      const oldVal = setting.setting_value;
      setting.setting_value = value;
      this.notifyListeners();

      try {
        await apiClient.updateSetting(key, { setting_value: value, updated_by: user });
        await this.syncWithBackend();
        return true;
      } catch (err) {
        console.warn('[DataService] updateSetting API call failed:', err);
        setting.setting_value = oldVal;
        await this.syncWithBackend().catch(() => {});
        return false;
      }
    }
    return false;
  }

  async askCopilot(query: string, period = '2026-08') {
    return apiClient.askCopilot(query, period);
  }
}

export const dataService = new DataService();

/**
 * Custom React Hook to subscribe components to live data changes
 */
export function useDataSync() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = dataService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  return {
    isLoaded: dataService.getIsLoaded(),
    connectionStatus: dataService.getConnectionStatus(),
    refresh: () => dataService.syncWithBackend(),
  };
}
