import { IUnitOfWork } from '../repositories/interfaces.js';
import { DocumentType } from '../types/domain.js';
import { ComplianceMatrixItem, ComplianceSummary } from '../types/api.js';

export class ComplianceEngine {
  constructor(private uow: IUnitOfWork) {}

  async evaluateCompliance(firm_id: string, period = '2026-08'): Promise<{
    matrix: ComplianceMatrixItem[];
    summary: ComplianceSummary;
  }> {
    const clients = await this.uow.clients.findAll(firm_id);
    const requirements = await this.uow.documentRequirements.findAll(firm_id);
    const overrides = await this.uow.periodRequirements.findAll(firm_id);
    const documents = await this.uow.documents.findAll(firm_id);
    const alerts = await this.uow.alerts.findAll(firm_id);

    const matrix: ComplianceMatrixItem[] = [];

    for (const client of clients) {
      if (!client.active) continue;

      const clientReqs = requirements.filter(r => r.client_id === client.client_id && r.active);

      for (const req of clientReqs) {
        // 1. Check Period Requirement Override
        const override = overrides.find(o => 
          o.client_id === client.client_id && 
          o.document_type.toLowerCase() === req.document_type.toLowerCase() && 
          o.period === period
        );

        if (override && override.status === 'Not Required') {
          matrix.push({
            client_id: client.client_id,
            client_name: client.display_name,
            period,
            document_type: req.document_type,
            status: 'Not Required',
            due_date: `${period}-${String(req.due_day).padStart(2, '0')}`
          });
          continue;
        }

        // 2. Check Received Documents
        const receivedDoc = documents.find(d => 
          d.client_id === client.client_id && 
          d.document_type.toLowerCase() === req.document_type.toLowerCase() && 
          d.period === period
        );

        const openAlert = alerts.find(a => 
          a.client_id === client.client_id && 
          a.document_type.toLowerCase() === req.document_type.toLowerCase() && 
          a.period === period && 
          a.status === 'Open'
        );

        let status: 'Received' | 'Missing' | 'Review Required' | 'Wrong Period' | 'Not Required' = 'Missing';

        if (receivedDoc) {
          if (receivedDoc.validation_status === 'Valid' && receivedDoc.processing_status === 'Processed') {
            status = 'Received';
          } else if (receivedDoc.validation_status === 'Review Required' || receivedDoc.validation_status === 'Pending') {
            status = 'Review Required';
          } else if (receivedDoc.period !== period) {
            status = 'Wrong Period';
          } else {
            status = 'Review Required';
          }
        } else {
          status = 'Missing';
        }

        matrix.push({
          client_id: client.client_id,
          client_name: client.display_name,
          period,
          document_type: req.document_type,
          status,
          due_date: `${period}-${String(req.due_day).padStart(2, '0')}`,
          document_id: receivedDoc?.document_id,
          alert_id: openAlert?.alert_id
        });
      }
    }

    const total = matrix.length;
    const received = matrix.filter(m => m.status === 'Received').length;
    const missing = matrix.filter(m => m.status === 'Missing').length;
    const review_required = matrix.filter(m => m.status === 'Review Required').length;
    const not_required = matrix.filter(m => m.status === 'Not Required').length;
    const pending = matrix.filter(m => m.status === 'Wrong Period').length;

    const on_track = received + not_required;
    const on_track_percentage = total > 0 ? Math.round((on_track / total) * 100) : 100;

    const summary: ComplianceSummary = {
      on_track,
      missing,
      needs_review: review_required,
      pending,
      not_required,
      total,
      on_track_percentage
    };

    return { matrix, summary };
  }
}
