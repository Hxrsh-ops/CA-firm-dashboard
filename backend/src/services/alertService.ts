import { IUnitOfWork } from '../repositories/interfaces.js';
import { Alert, AlertType, AlertSeverity, AlertStatus, DocumentType } from '../types/domain.js';
import { AuditService } from './auditService.js';

export class AlertService {
  private auditService: AuditService;

  constructor(private uow: IUnitOfWork) {
    this.auditService = new AuditService(uow);
  }

  async getAllAlerts(firm_id: string): Promise<Alert[]> {
    return this.uow.alerts.findAll(firm_id);
  }

  async getAlertById(firm_id: string, alertId: string): Promise<Alert | null> {
    return this.uow.alerts.findById(firm_id, alertId);
  }

  async createAlert(params: {
    firm_id: string;
    client_id: string;
    document_type: DocumentType;
    period: string;
    alert_type: AlertType;
    severity: AlertSeverity;
    message: string;
    assigned_to?: string;
  }): Promise<Alert> {
    // Deduplicate existing open alerts for same client + doc + period + alert_type
    const existing = await this.uow.alerts.findOpenByClientAndDoc(
      params.firm_id,
      params.client_id,
      params.document_type,
      params.period,
      params.alert_type
    );
    if (existing) {
      return existing;
    }

    const alertId = `ALT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const alert: Alert = {
      alert_id: alertId,
      firm_id: params.firm_id,
      client_id: params.client_id,
      document_type: params.document_type,
      period: params.period,
      alert_type: params.alert_type,
      severity: params.severity,
      message: params.message,
      status: 'Open',
      created_at: new Date().toISOString(),
      resolved_at: null,
      assigned_to: params.assigned_to || 'CA Partner'
    };

    const saved = await this.uow.alerts.create(alert);

    await this.auditService.log({
      firm_id: params.firm_id,
      user: 'CA Copilot Rule Engine',
      action: 'ALERT_CREATED',
      entity_type: 'Alert',
      entity_id: alertId,
      new_value: alert,
      reason: `Automated alert creation: ${params.alert_type}`
    });

    return saved;
  }

  async updateAlertStatus(
    firm_id: string, 
    alertId: string, 
    status: AlertStatus, 
    user = 'CA Partner',
    notes?: string
  ): Promise<Alert | null> {
    const alert = await this.uow.alerts.findById(firm_id, alertId);
    if (!alert) return null;

    const resolved_at = (status === 'Resolved' || status === 'Dismissed') ? new Date().toISOString() : null;
    const updated = await this.uow.alerts.update(firm_id, alertId, { status, resolved_at });

    if (updated) {
      await this.auditService.log({
        firm_id,
        user,
        action: `ALERT_${status.toUpperCase()}`,
        entity_type: 'Alert',
        entity_id: alertId,
        old_value: { status: alert.status },
        new_value: { status, resolved_at, notes },
        reason: notes || `Alert marked as ${status}`
      });
    }

    return updated;
  }
}
