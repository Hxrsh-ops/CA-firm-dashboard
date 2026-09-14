import { Client, DocumentType } from '../../types/domain.js';

export type CopilotIntentType = 
  | 'GET_ATTENTION_ITEMS'
  | 'GET_MISSING_DOCUMENTS'
  | 'GET_CLIENT_COMPLIANCE'
  | 'GET_CLIENT_SUMMARY'
  | 'GET_REVIEW_ITEMS'
  | 'GET_PENDING_REMINDERS'
  | 'GET_DOCUMENT_SUMMARY'
  | 'GET_OPEN_ALERTS'
  | 'DRAFT_REMINDER'
  | 'GET_COMPLIANCE_SUMMARY'
  | 'GENERAL_COPILOT_QUERY';

export interface ParsedCopilotQuery {
  intent: CopilotIntentType;
  targetClientId?: string;
  targetClientName?: string;
  documentType?: DocumentType | string;
  period: string;
  rawMessage: string;
}

const KNOWN_DOC_TYPES: Array<{ alias: string[]; type: DocumentType }> = [
  { alias: ['bank statement', 'bank statements', 'bank stmt', 'bank stmts', 'bank'], type: 'Bank Statement' },
  { alias: ['sales register', 'sales registers', 'gstr-1', 'sales summary', 'sales'], type: 'Sales Register' },
  { alias: ['purchase register', 'purchase registers', 'gstr-2b', 'purchase summary', 'purchases'], type: 'Purchase Register' },
  { alias: ['payroll summary', 'payroll summaries', 'salary register', 'payroll register', 'payroll'], type: 'Payroll Summary' },
  { alias: ['expense bills', 'expense vouchers', 'expenses', 'expense bill'], type: 'Expense Bills' },
  { alias: ['tds return', 'tds returns', 'tds challan', 'tds'], type: 'TDS Return' },
  { alias: ['customs duty', 'customs duty challan', 'customs'], type: 'Customs Duty Challan' }
];

export class CopilotIntentService {
  /**
   * Parse user message into a clean, typed intent and extracted entities.
   */
  static parse(message: string, clients: Client[], defaultPeriod = '2026-08'): ParsedCopilotQuery {
    const rawMessage = message.trim();
    const lower = rawMessage.toLowerCase();

    // 1. Extract Period
    let period = defaultPeriod;
    if (lower.includes('august') || lower.includes('aug 2026') || lower.includes('2026-08')) {
      period = '2026-08';
    } else if (lower.includes('july') || lower.includes('jul 2026') || lower.includes('2026-07')) {
      period = '2026-07';
    }

    // 2. Extract Document Type
    let documentType: DocumentType | undefined = undefined;
    for (const item of KNOWN_DOC_TYPES) {
      if (item.alias.some(a => lower.includes(a))) {
        documentType = item.type;
        break;
      }
    }

    // 3. Extract Target Client with exact & whole-phrase preference
    let targetClient: Client | undefined = undefined;

    // First pass: exact match on display_name, legal_name, or client_id
    for (const client of clients) {
      const legalLower = (client.legal_name || '').toLowerCase();
      const displayLower = (client.display_name || '').toLowerCase();
      const idLower = (client.client_id || '').toLowerCase();

      if (
        (displayLower && lower.includes(displayLower)) ||
        (legalLower && lower.includes(legalLower)) ||
        (idLower && lower.includes(idLower))
      ) {
        targetClient = client;
        break;
      }
    }

    // Second pass: distinct multi-word match (e.g. "quantum bridge")
    if (!targetClient) {
      for (const client of clients) {
        const displayWords = (client.display_name || '').toLowerCase().split(' ').filter(w => w.length >= 4);
        if (displayWords.length >= 2 && displayWords.every(w => lower.includes(w))) {
          targetClient = client;
          break;
        }
      }
    }

    // Third pass: single distinctive word (e.g. "quantum" or "acme" or "apex")
    if (!targetClient) {
      for (const client of clients) {
        const firstWord = (client.display_name || '').toLowerCase().split(' ')[0];
        if (firstWord && firstWord.length >= 4 && new RegExp(`\\b${firstWord}\\b`, 'i').test(lower)) {
          targetClient = client;
          break;
        }
      }
    }

    let targetClientName = targetClient?.display_name;
    if (!targetClient) {
      const match = rawMessage.match(/(?:summarize|about|for|is)\s+([A-Z][a-zA-Z0-9\s&]+?)(?:\s+only|\s+compliant|\s+for|\?|\.|$)/i);
      if (match && match[1]) {
        targetClientName = match[1].trim();
      }
    }

    // 4. Classify Intent
    let intent: CopilotIntentType = 'GENERAL_COPILOT_QUERY';

    if (
      lower.includes('attention') ||
      lower.includes('today') ||
      lower.includes('need attention') ||
      lower.includes('what needs my attention') ||
      lower.includes('priorities')
    ) {
      intent = 'GET_ATTENTION_ITEMS';
    } else if (
      lower.includes('draft') ||
      lower.includes('compose reminder') ||
      lower.includes('write reminder') ||
      lower.includes('prepare reminder')
    ) {
      intent = 'DRAFT_REMINDER';
    } else if (
      lower.includes('why is') ||
      (lower.includes('compliant') && (lower.includes('%') || targetClient || targetClientName))
    ) {
      intent = 'GET_CLIENT_COMPLIANCE';
    } else if (
      (lower.includes('summarize') || lower.includes('summary of') || lower.includes('tell me about') || lower.includes('profile')) &&
      (targetClient || targetClientName)
    ) {
      intent = 'GET_CLIENT_SUMMARY';
    } else if (
      lower.includes('missing') ||
      lower.includes('haven\'t submitted') ||
      lower.includes('have not submitted') ||
      lower.includes('pending submission') ||
      lower.includes('not submitted')
    ) {
      intent = 'GET_MISSING_DOCUMENTS';
    } else if (
      lower.includes('review') ||
      lower.includes('under review') ||
      lower.includes('review-required') ||
      lower.includes('needs review')
    ) {
      intent = 'GET_REVIEW_ITEMS';
    } else if (
      lower.includes('reminders') && (lower.includes('pending') || lower.includes('approval') || lower.includes('staged') || lower.includes('queued'))
    ) {
      intent = 'GET_PENDING_REMINDERS';
    } else if (
      lower.includes('alert') ||
      lower.includes('exception') ||
      lower.includes('discrepanc') ||
      lower.includes('open alerts')
    ) {
      intent = 'GET_OPEN_ALERTS';
    } else if (
      lower.includes('documents received') ||
      lower.includes('received this month') ||
      lower.includes('how many documents') ||
      lower.includes('document count')
    ) {
      intent = 'GET_DOCUMENT_SUMMARY';
    } else if (
      lower.includes('compliance summary') ||
      lower.includes('overall compliance') ||
      lower.includes('compliance rate') ||
      lower.includes('compliance status')
    ) {
      if (targetClient) {
        intent = 'GET_CLIENT_COMPLIANCE';
      } else {
        intent = 'GET_COMPLIANCE_SUMMARY';
      }
    }

    return {
      intent,
      targetClientId: targetClient?.client_id,
      targetClientName: targetClientName || targetClient?.display_name,
      documentType,
      period,
      rawMessage
    };
  }
}
