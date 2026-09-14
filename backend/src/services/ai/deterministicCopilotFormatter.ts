import { CopilotIntentType, ParsedCopilotQuery } from './copilotIntentService.js';
import { ComplianceMatrixItem, ComplianceSummary, DashboardAttentionMetrics } from '../../types/api.js';
import { Client, Document, Alert, Reminder, Firm } from '../../types/domain.js';

export interface CopilotFactualContext {
  intent: CopilotIntentType;
  parsed: ParsedCopilotQuery;
  firm: Firm;
  period: string;
  clients: Client[];
  documents: Document[];
  alerts: Alert[];
  reminders: Reminder[];
  matrix: ComplianceMatrixItem[];
  complianceSummary: ComplianceSummary;
  attentionMetrics: DashboardAttentionMetrics;
  targetClient?: Client;
  filteredMatrix?: ComplianceMatrixItem[];
  targetAlerts?: Alert[];
  targetReminders?: Reminder[];
  targetDocuments?: Document[];
  draftedReminder?: {
    recipient_name: string;
    recipient_email: string;
    subject: string;
    body: string;
    missing_items: string[];
  };
}

export class DeterministicCopilotFormatter {
  static format(ctx: CopilotFactualContext): {
    answer: string;
    source: string;
    suggestedActions: string[];
  } {
    const { intent, firm, period, targetClient, draftedReminder } = ctx;
    const firmName = firm.legal_name || 'Vertex & Associates';

    switch (intent) {
      case 'GET_ATTENTION_ITEMS': {
        const { attentionMetrics, alerts, reminders, matrix } = ctx;
        const missingCount = attentionMetrics.missing_documents;
        const reviewCount = attentionMetrics.needs_review;
        const pendingRemindersCount = reminders.filter(r => r.status === 'Pending Approval').length;
        const openAlertsCount = alerts.filter(a => a.status === 'Open').length;

        const lines: string[] = [
          `**Operational Attention Summary for ${firmName}** (Period: **${period}**):`,
          '',
          `• **${missingCount} Missing Documents**: Client submissions outstanding for statutory compliance.`,
          `• **${reviewCount} Inbound Items Under Review**: AI intake flagged items requiring partner sign-off.`,
          `• **${openAlertsCount} Open Exceptions / Alerts**: Cross-period or duplicate rule triggers pending review.`,
          `• **${pendingRemindersCount} Reminders Pending Approval**: Staged client communications ready for dispatch.`
        ];

        const topMissing = matrix.filter(m => m.status === 'Missing').slice(0, 3);
        if (topMissing.length > 0) {
          lines.push('');
          lines.push('**Top Priority Items:**');
          topMissing.forEach((m, idx) => {
            lines.push(`${idx + 1}. **${m.client_name}** — ${m.document_type} (Due: ${m.due_date})`);
          });
        }

        return {
          answer: lines.join('\n'),
          source: `Based on authoritative ${period} compliance and intake records.`,
          suggestedActions: [
            'Which clients are missing documents?',
            'Which reminders are pending approval?',
            'Show me clients with review-required documents'
          ]
        };
      }

      case 'GET_MISSING_DOCUMENTS': {
        let missingList = ctx.matrix.filter(m => m.status === 'Missing');
        if (ctx.parsed.documentType) {
          missingList = missingList.filter(m => m.document_type.toLowerCase() === ctx.parsed.documentType?.toLowerCase());
        }
        if (targetClient) {
          missingList = missingList.filter(m => m.client_id === targetClient.client_id);
        }

        const docTypeLabel = ctx.parsed.documentType ? `**${ctx.parsed.documentType}**` : 'statutory documents';
        const clientLabel = targetClient ? ` for **${targetClient.display_name}**` : '';

        if (missingList.length === 0) {
          return {
            answer: `All required ${docTypeLabel} for period **${period}**${clientLabel} have been received and verified under **${firmName}**. Zero pending submissions.`,
            source: `Based on ${period} compliance records.`,
            suggestedActions: ['What needs my attention today?', 'Show GSTR-1 readiness overview']
          };
        }

        const lines = [
          `Found **${missingList.length} missing document items** (${docTypeLabel}${clientLabel}, Period: **${period}**):`,
          ''
        ];

        // Group by client if multiple
        const clientGroups = new Map<string, string[]>();
        for (const item of missingList) {
          if (!clientGroups.has(item.client_name)) {
            clientGroups.set(item.client_name, []);
          }
          clientGroups.get(item.client_name)!.push(`${item.document_type} (Due: ${item.due_date})`);
        }

        let idx = 1;
        for (const [cName, docs] of clientGroups.entries()) {
          lines.push(`${idx}. **${cName}**:\n   • ${docs.join('\n   • ')}`);
          idx++;
          if (idx > 8) {
            lines.push(`... and ${clientGroups.size - 8} other clients.`);
            break;
          }
        }

        return {
          answer: lines.join('\n'),
          source: `Based on ${period} document requirement roster.`,
          suggestedActions: [
            'Draft a reminder for clients missing payroll summaries',
            'Which reminders are pending approval?',
            'What needs my attention today?'
          ]
        };
      }

      case 'GET_CLIENT_COMPLIANCE': {
        if (!targetClient) {
          return {
            answer: `Please specify a client entity (e.g. *Quantum Bridge*, *Acme Global*, *Apex Labs*) to inspect specific compliance percentages and missing requirements.`,
            source: 'Based on client compliance roster.',
            suggestedActions: [
              'Why is Quantum Bridge only 60% compliant?',
              'Give me a compliance summary for August 2026'
            ]
          };
        }

        const clientItems = ctx.matrix.filter(m => m.client_id === targetClient.client_id);
        const received = clientItems.filter(m => m.status === 'Received').length;
        const missing = clientItems.filter(m => m.status === 'Missing');
        const notReq = clientItems.filter(m => m.status === 'Not Required').length;
        const total = clientItems.length;
        const pct = total > 0 ? Math.round(((received + notReq) / total) * 100) : 100;

        const lines = [
          `**${targetClient.legal_name} (${targetClient.client_id})** Compliance Breakdown (Period: **${period}**):`,
          '',
          `• **Overall Compliance Score**: **${pct}%** (${received} received, ${notReq} not required out of ${total} total requirements)`,
          `• **Status**: ${pct === 100 ? '✅ Fully Compliant' : `⚠️ ${missing.length} Item(s) Outstanding`}`,
          `• **Assigned CA**: ${targetClient.assigned_ca || 'CA Partner'}`
        ];

        if (missing.length > 0) {
          lines.push('');
          lines.push('**Outstanding / Missing Requirements:**');
          missing.forEach((m, i) => {
            lines.push(`${i + 1}. **${m.document_type}** — Due Date: ${m.due_date}`);
          });
          lines.push('');
          lines.push(`*Reason for ${pct}% Score*: Compliance is calculated strictly against the ${total} mandatory requirement slots defined on the client roster.`);
        }

        return {
          answer: lines.join('\n'),
          source: `Based on authoritative ${period} compliance evaluations for ${targetClient.client_id}.`,
          suggestedActions: [
            `Summarize ${targetClient.display_name}`,
            `Draft reminder for ${targetClient.display_name}`,
            'What needs my attention today?'
          ]
        };
      }

      case 'GET_CLIENT_SUMMARY': {
        if (!targetClient) {
          return {
            answer: `Could not identify the requested client entity. Please check the legal name or client code (CLI-001 through CLI-010).`,
            source: 'Based on client directory.',
            suggestedActions: ['Which clients are missing documents?', 'What needs my attention today?']
          };
        }

        const clientDocs = ctx.documents.filter(d => d.client_id === targetClient.client_id);
        const clientAlerts = ctx.alerts.filter(a => a.client_id === targetClient.client_id && a.status === 'Open');
        const clientReminders = ctx.reminders.filter(r => r.client_id === targetClient.client_id);
        const clientMatrix = ctx.matrix.filter(m => m.client_id === targetClient.client_id);
        const missing = clientMatrix.filter(m => m.status === 'Missing');

        const lines = [
          `**Client Profile: ${targetClient.legal_name}**`,
          '',
          `• **Client ID**: \`${targetClient.client_id}\` | **Entity Type**: ${targetClient.entity_type}`,
          `• **Primary Contact**: ${targetClient.primary_email} (${targetClient.phone})`,
          `• **Assigned CA**: ${targetClient.assigned_ca || 'CA Partner'}`,
          `• **Active Inbound Documents**: ${clientDocs.length} recorded`,
          `• **Open Compliance Alerts**: ${clientAlerts.length}`,
          `• **Active Reminders**: ${clientReminders.length} (${clientReminders.filter(r => r.status === 'Pending Approval').length} pending approval)`,
          `• **Period ${period} Missing Requirements**: ${missing.length > 0 ? missing.map(m => m.document_type).join(', ') : 'None (Fully Compliant)'}`
        ];

        return {
          answer: lines.join('\n'),
          source: `Based on client record ${targetClient.client_id} under ${firmName}.`,
          suggestedActions: [
            `Why is ${targetClient.display_name} only ${Math.round(((clientMatrix.filter(m => m.status === 'Received' || m.status === 'Not Required').length) / (clientMatrix.length || 1)) * 100)}% compliant?`,
            `Draft reminder for ${targetClient.display_name}`,
            'What needs my attention today?'
          ]
        };
      }

      case 'GET_REVIEW_ITEMS': {
        const reviewDocs = ctx.documents.filter(d => d.validation_status === 'Review Required' || d.validation_status === 'Pending');
        if (reviewDocs.length === 0) {
          return {
            answer: `There are currently **0 documents** requiring partner review. All inbound statutory files have been validated against schema rules.`,
            source: 'Based on document intake records.',
            suggestedActions: ['What needs my attention today?', 'Which clients are missing documents?']
          };
        }

        const lines = [
          `Found **${reviewDocs.length} document(s) requiring partner review**:`,
          ''
        ];

        reviewDocs.forEach((doc, idx) => {
          const client = ctx.clients.find(c => c.client_id === doc.client_id);
          const cName = client?.display_name || doc.sender_email;
          lines.push(`${idx + 1}. **${cName}** — ${doc.document_type} (\`${doc.filename}\`)`);
          lines.push(`   • AI Confidence: ${(doc.ai_confidence * 100).toFixed(1)}% | Status: ${doc.validation_status}`);
          if (doc.notes) lines.push(`   • Reason: ${doc.notes}`);
        });

        return {
          answer: lines.join('\n'),
          source: 'Based on AI Intake Inbox review queue.',
          suggestedActions: ['View AI Inbox', 'What needs my attention today?']
        };
      }

      case 'GET_PENDING_REMINDERS': {
        const pendingReminders = ctx.reminders.filter(r => r.status === 'Pending Approval');
        if (pendingReminders.length === 0) {
          return {
            answer: `There are currently **0 reminder drafts** pending partner sign-off. All reminders are either Draft, Approved, or Sent.`,
            source: 'Based on reminder engine queue.',
            suggestedActions: [
              'Draft a reminder for clients missing payroll summaries',
              'What needs my attention today?'
            ]
          };
        }

        const lines = [
          `Found **${pendingReminders.length} reminder(s) pending partner approval**:`,
          ''
        ];

        pendingReminders.forEach((r, idx) => {
          const client = ctx.clients.find(c => c.client_id === r.client_id);
          lines.push(`${idx + 1}. **${client?.display_name || r.client_id}** — ${r.document_type}`);
          lines.push(`   • Subject: *"${r.subject}"*`);
          lines.push(`   • Recipient: ${r.recipient_email}`);
        });

        lines.push('');
        lines.push('*Reminder*: Reminders will only be dispatched to clients after explicit CA Partner sign-off in the Reminders workspace.');

        return {
          answer: lines.join('\n'),
          source: 'Based on staged reminder records.',
          suggestedActions: ['View Reminders Queue', 'What needs my attention today?']
        };
      }

      case 'GET_OPEN_ALERTS': {
        const openAlerts = ctx.alerts.filter(a => a.status === 'Open');
        if (openAlerts.length === 0) {
          return {
            answer: `There are currently **0 open alerts**. All inbound client submissions and statutory deadlines are fully reconciled with zero rule discrepancies.`,
            source: 'Based on compliance alert logs.',
            suggestedActions: ['What needs my attention today?', 'Give me a compliance summary for August 2026']
          };
        }

        const lines = [
          `Found **${openAlerts.length} open compliance alert(s)**:`,
          ''
        ];

        openAlerts.forEach((a, idx) => {
          const client = ctx.clients.find(c => c.client_id === a.client_id);
          lines.push(`${idx + 1}. **${client?.display_name || a.client_id}** [${a.alert_type}] — Severity: **${a.severity}**`);
          lines.push(`   • Message: ${a.message}`);
          lines.push(`   • Document: ${a.document_type} (Period: ${a.period})`);
        });

        return {
          answer: lines.join('\n'),
          source: 'Based on deterministic rule alert log.',
          suggestedActions: ['View Alerts Queue', 'What needs my attention today?']
        };
      }

      case 'GET_DOCUMENT_SUMMARY': {
        const total = ctx.documents.length;
        const valid = ctx.documents.filter(d => d.validation_status === 'Valid').length;
        const reviewReq = ctx.documents.filter(d => d.validation_status === 'Review Required').length;

        const lines = [
          `**Document Intake Summary for ${firmName}** (Total Inbound: **${total}**):`,
          '',
          `• **Valid & Processed**: **${valid}** documents verified against statutory rules.`,
          `• **Review Required**: **${reviewReq}** documents flagged for partner inspection.`,
          `• **Active Managed Clients**: **${ctx.clients.length}** client entities.`
        ];

        return {
          answer: lines.join('\n'),
          source: 'Based on document repository records.',
          suggestedActions: ['Which clients are missing documents?', 'What needs my attention today?']
        };
      }

      case 'GET_COMPLIANCE_SUMMARY': {
        const { complianceSummary } = ctx;
        const lines = [
          `**Practice Compliance Overview for Period: ${period}**`,
          '',
          `• **Overall Compliance Score**: **${complianceSummary.on_track_percentage}%**`,
          `• **On Track Requirements**: **${complianceSummary.on_track}** of ${complianceSummary.total}`,
          `• **Missing Submissions**: **${complianceSummary.missing}** items across client entities`,
          `• **Review Required**: **${complianceSummary.needs_review}** items`,
          `• **Not Required / Overridden**: **${complianceSummary.not_required}** items`
        ];

        return {
          answer: lines.join('\n'),
          source: `Based on ${period} compliance evaluations under ${firmName}.`,
          suggestedActions: [
            'Which clients are missing documents?',
            'Draft a reminder for clients missing payroll summaries',
            'What needs my attention today?'
          ]
        };
      }

      case 'DRAFT_REMINDER': {
        if (!draftedReminder) {
          return {
            answer: `Could not identify any missing document requirements matching your request to draft a reminder for. All specified items appear to be on track.`,
            source: 'Based on compliance requirement rules.',
            suggestedActions: ['Which clients are missing documents?', 'What needs my attention today?']
          };
        }

        const lines = [
          `**Draft Client Reminder Generated** (Staged for CA Partner Review):`,
          '',
          `> **To**: ${draftedReminder.recipient_name} <${draftedReminder.recipient_email}>`,
          `> **Subject**: ${draftedReminder.subject}`,
          `>`,
          ...draftedReminder.body.split('\n').map(l => `> ${l}`),
          '',
          `*Note: This reminder draft has been prepared strictly for partner sign-off. CA Copilot will never autonomously dispatch emails without partner confirmation.*`
        ];

        return {
          answer: lines.join('\n'),
          source: `Drafted from ${period} outstanding requirements.`,
          suggestedActions: [
            'View Reminders Queue',
            'Which reminders are pending approval?',
            'What needs my attention today?'
          ]
        };
      }

      case 'GENERAL_COPILOT_QUERY':
      default: {
        const lines = [
          `Good day, Partner. I am your **CA Copilot Operations Assistant** for **${firmName}**.`,
          '',
          `I can inspect authoritative practice records, answer compliance queries, identify missing statutory documents, or draft client reminders:`,
          '',
          `• *"What needs my attention today?"* — Comprehensive daily priority work summary`,
          `• *"Which clients are missing August bank statements?"* — Filtered requirement audit`,
          `• *"Why is Quantum Bridge only 60% compliant?"* — Specific entity breakdown`,
          `• *"Summarize Quantum Bridge"* — Complete client overview`,
          `• *"Which reminders are pending approval?"* — Staged reminder queue`
        ];

        return {
          answer: lines.join('\n'),
          source: `Connected to live practice database for ${firmName}.`,
          suggestedActions: [
            'What needs my attention today?',
            'Which clients are missing documents?',
            'Why is Quantum Bridge only 60% compliant?'
          ]
        };
      }
    }
  }
}
