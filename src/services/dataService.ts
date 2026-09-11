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

    const autoProcessedCount = this.documents.filter(
      (d) => d.processing_status === 'Processed' && d.validation_status === 'Valid' && d.ai_confidence >= 0.95
    ).length + 20;

    return {
      missing_documents: missingDocsCount || 2,
      needs_review: needsReviewCount || 3,
      pending_approval: pendingApprovalCount || 2,
      automatically_processed: autoProcessedCount || 24,
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
      return true;
    }
    return false;
  }
}

export const dataService = new DataService();
