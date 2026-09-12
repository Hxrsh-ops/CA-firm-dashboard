import { IUnitOfWork } from '../repositories/interfaces.js';
import { AuditLog } from '../types/domain.js';

export class AuditService {
  constructor(private uow: IUnitOfWork) {}

  async log(params: {
    firm_id: string;
    user: string;
    action: string;
    entity_type: string;
    entity_id: string;
    old_value?: any;
    new_value?: any;
    reason?: string;
  }): Promise<AuditLog> {
    const entry: AuditLog = {
      log_id: `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      firm_id: params.firm_id,
      timestamp: new Date().toISOString(),
      user: params.user,
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      old_value: params.old_value !== undefined ? (typeof params.old_value === 'string' ? params.old_value : JSON.stringify(params.old_value)) : null,
      new_value: params.new_value !== undefined ? (typeof params.new_value === 'string' ? params.new_value : JSON.stringify(params.new_value)) : null,
      reason: params.reason || null
    };

    return this.uow.auditLogs.append(entry);
  }

  async getFirmLogs(firm_id: string): Promise<AuditLog[]> {
    return this.uow.auditLogs.findAll(firm_id);
  }
}
