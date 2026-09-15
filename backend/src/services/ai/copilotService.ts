import { IUnitOfWork } from '../../repositories/interfaces.js';
import { Firm } from '../../types/domain.js';
import { DashboardAttentionMetrics } from '../../types/api.js';
import { AIProvider } from './aiProvider.js';
import { GeminiProvider } from './geminiProvider.js';
import { CopilotIntentService, ParsedCopilotQuery } from './copilotIntentService.js';
import { DeterministicCopilotFormatter, CopilotFactualContext } from './deterministicCopilotFormatter.js';
import { ComplianceEngine } from '../complianceEngine.js';
import { DashboardService } from '../dashboardService.js';
import { env } from '../../config/env.js';

export interface CopilotChatResponse {
  answer: string;
  intent: string;
  source: string;
  grounded: boolean;
  suggestedActions: string[];
  aiProvider: 'gemini' | 'deterministic';
  contextSummary?: {
    firm_id: string;
    period: string;
    client_count: number;
    target_client?: string;
  };
}

export class CopilotService {
  private complianceEngine: ComplianceEngine;
  private dashboardService: DashboardService;
  private aiProvider: AIProvider;

  constructor(private uow: IUnitOfWork, aiProvider?: AIProvider) {
    this.complianceEngine = new ComplianceEngine(uow);
    this.dashboardService = new DashboardService(uow);
    this.aiProvider = aiProvider || new GeminiProvider(env.GEMINI_API_KEY);
  }

  async processQuery(firm_id: string, userMessage: string, overridePeriod?: string): Promise<CopilotChatResponse> {
    if (!userMessage || !userMessage.trim()) {
      return {
        answer: 'Please provide a question or request for CA Copilot.',
        intent: 'GENERAL_COPILOT_QUERY',
        source: 'CA Copilot Assistant',
        grounded: true,
        suggestedActions: ['What needs my attention today?', 'Which clients are missing documents?'],
        aiProvider: 'deterministic'
      };
    }

    // Fast-path: Check for pure greetings before expensive authoritative data retrieval & LLM synthesis
    const preliminaryParsed = CopilotIntentService.parse(userMessage, []);
    if (preliminaryParsed.intent === 'GREETING') {
      return {
        answer: 'Good day, Partner. How can I help you with practice operations today?',
        intent: 'GREETING',
        source: 'CA Copilot Assistant',
        grounded: true,
        suggestedActions: [
          'What needs my attention today?',
          'Which clients are missing documents?',
          'Why is Quantum Bridge only 60% compliant?'
        ],
        aiProvider: 'deterministic'
      };
    }

    // 1. Fetch Authoritative Data from Unit of Work in Parallel
    const defaultFirm: Firm = {
      firm_id,
      legal_name: 'Vertex & Associates',
      display_name: 'Vertex & Associates',
      firm_type: 'Chartered Accountants',
      primary_email: 'admin@vertexca.example',
      primary_phone: '+91-9000000000',
      address: 'Chennai',
      timezone: 'Asia/Kolkata',
      active: true,
      created_at: new Date().toISOString()
    };

    const targetPeriod = overridePeriod || (userMessage.toLowerCase().includes('july') || userMessage.toLowerCase().includes('2026-07') ? '2026-07' : '2026-08');

    const [firmRes, clients, documents, alerts, reminders, { matrix, summary: complianceSummary }] = await Promise.all([
      this.uow.firms.findById(firm_id).catch(() => null),
      this.uow.clients.findAll(firm_id).catch(() => []),
      this.uow.documents.findAll(firm_id).catch(() => []),
      this.uow.alerts.findAll(firm_id).catch(() => []),
      this.uow.reminders.findAll(firm_id).catch(() => []),
      this.complianceEngine.evaluateCompliance(firm_id, targetPeriod).catch(() => ({
        matrix: [],
        summary: { on_track: 0, missing: 0, needs_review: 0, pending: 0, not_required: 0, total: 0, on_track_percentage: 100 }
      }))
    ]);

    const firm: Firm = firmRes || defaultFirm;

    // 2. Parse Intent and Entities
    const parsed = CopilotIntentService.parse(userMessage, clients, targetPeriod);
    const period = parsed.period;

    // 3. Compute Attention Metrics Directly (zero extra roundtrips)
    const attentionMetrics: DashboardAttentionMetrics = {
      missing_documents: matrix.filter(m => m.status === 'Missing').length,
      needs_review: documents.filter(d => d.validation_status === 'Review Required' || d.validation_status === 'Pending').length,
      pending_approval: reminders.filter(r => r.status === 'Pending Approval').length,
      automatically_processed: documents.filter(d => d.validation_status === 'Valid' && d.processing_status === 'Processed').length
    };

    const targetClient = parsed.targetClientId 
      ? clients.find(c => c.client_id === parsed.targetClientId) 
      : undefined;

    // 4. Handle Specific Logic for DRAFT_REMINDER if requested
    let draftedReminder: CopilotFactualContext['draftedReminder'] | undefined = undefined;
    if (parsed.intent === 'DRAFT_REMINDER') {
      let clientForDraft = targetClient;
      let missingForClient = matrix.filter(m => m.status === 'Missing');

      if (parsed.documentType) {
        const filterType = parsed.documentType.toLowerCase();
        missingForClient = missingForClient.filter(m => {
          const itemType = m.document_type.toLowerCase();
          return itemType === filterType ||
            (filterType.includes('payroll') && itemType.includes('payroll')) ||
            (filterType.includes('sales') && itemType.includes('sales')) ||
            (filterType.includes('purchase') && itemType.includes('purchase')) ||
            (filterType.includes('bank') && itemType.includes('bank')) ||
            (filterType.includes('expense') && itemType.includes('expense'));
        });
      }

      if (clientForDraft) {
        missingForClient = missingForClient.filter(m => m.client_id === clientForDraft?.client_id);
      } else if (missingForClient.length > 0) {
        // Pick first client with missing item
        const firstMissing = missingForClient[0];
        clientForDraft = clients.find(c => c.client_id === firstMissing.client_id);
        missingForClient = missingForClient.filter(m => m.client_id === clientForDraft?.client_id);
      }

      if (clientForDraft && missingForClient.length > 0) {
        const missingNames = missingForClient.map(m => m.document_type);
        draftedReminder = {
          recipient_name: clientForDraft.display_name,
          recipient_email: clientForDraft.primary_email,
          subject: `Statutory Filing Reminder: Pending ${missingNames.join(', ')} for ${period}`,
          body: `Dear ${clientForDraft.display_name} Team,\n\nThis is a friendly reminder from Vertex & Associates regarding your statutory filing compliance for period ${period}.\n\nAccording to our records, the following document(s) are currently outstanding:\n${missingNames.map(n => `• ${n}`).join('\n')}\n\nPlease submit these files at your earliest convenience to avoid statutory interest or late filing penalties.\n\nWarm regards,\n${clientForDraft.assigned_ca || 'CA Biju'}\nVertex & Associates, Chartered Accountants`,
          missing_items: missingNames
        };
      }
    }

    // 5. Identify New/Recent Clients and Build Structured Factual Context
    const newClients = clients.filter(c => c.created_at && c.created_at.startsWith(period));

    const factualContext: CopilotFactualContext = {
      intent: parsed.intent,
      parsed,
      firm,
      period,
      clients,
      newClients,
      documents,
      alerts,
      reminders,
      matrix,
      complianceSummary,
      attentionMetrics,
      targetClient,
      draftedReminder
    };

    // 6. Generate Baseline Deterministic Response
    const deterministicResult = DeterministicCopilotFormatter.format(factualContext);

    // 7. Enhance with Gemini if Configured
    let finalAnswer = deterministicResult.answer;
    let usedProvider: 'gemini' | 'deterministic' = 'deterministic';

    if (this.aiProvider.isConfigured()) {
      const systemInstruction = `You are CA Copilot, an AI operations assistant for Chartered Accountants at ${firm.legal_name}.
CRITICAL ARCHITECTURAL RULES:
1. Answer strictly and exclusively from the provided AUTHORITATIVE CA COPILOT FACTS below.
2. NEVER hallucinate or invent client names, documents, deadlines, filing statuses, or compliance numbers.
3. You must preserve every authoritative quantitative fact exactly as provided. This includes percentages, scores, counts, totals, dates, periods, statuses, and document names. Never omit, alter, round, reinterpret, or truncate a quantitative value. If the baseline answer contains a metric such as '60%', the final response must contain that exact '60%' value. Never output an empty metric heading such as 'Overall Compliance Score:' without its corresponding value.
4. Keep answers concise, highly structured, professional, and easy for a CA Partner to scan.
5. If information is not in the facts, state clearly that it is not recorded in the practice database.
6. Use markdown formatting (bolding, bullet points) cleanly.`;

      const newClientsFact = newClients.length > 0
        ? newClients.map(c => `${c.legal_name} (${c.client_id}, Onboarded: ${c.created_at ? c.created_at.split('T')[0] : 'N/A'})`).join('; ')
        : `0 new clients onboarded in ${period} (Total active clients: ${clients.length})`;

      const prompt = `USER QUESTION: "${userMessage}"

AUTHORITATIVE PRACTICE FACTS:
- Firm: ${firm.legal_name} (Firm ID: ${firm.firm_id})
- Evaluation Period: ${period}
- Total Active Clients: ${clients.length}
- Target Client: ${targetClient ? `${targetClient.legal_name} (${targetClient.client_id})` : 'None specified'}
- New Clients in Period ${period}: ${newClientsFact}
- Compliance Score (Period ${period}): ${complianceSummary.on_track_percentage}% (${complianceSummary.on_track} on track, ${complianceSummary.missing} missing, ${complianceSummary.needs_review} needs review)
- Missing Documents Count: ${attentionMetrics.missing_documents}
- Review Required Inbound Items: ${attentionMetrics.needs_review}
- Open Alerts Count: ${alerts.filter(a => a.status === 'Open').length}
- Pending Reminders Count: ${reminders.filter(r => r.status === 'Pending Approval').length}

BASELINE VERIFIED ANSWER:
${deterministicResult.answer}

Please synthesize a grounded, professional response based strictly on these facts. You must preserve every authoritative quantitative fact, percentage, metric score, count, and date exactly without alteration or truncation.`;

      try {
        const aiResponse = await this.aiProvider.generateResponse(prompt, systemInstruction);
        if (aiResponse && aiResponse.trim().length > 0) {
          finalAnswer = aiResponse.trim();
          usedProvider = 'gemini';
        }
      } catch (err) {
        console.warn('[CopilotService] AI Provider execution fallback to deterministic formatter:', err);
      }
    }

    return {
      answer: finalAnswer,
      intent: parsed.intent,
      source: deterministicResult.source,
      grounded: true,
      suggestedActions: deterministicResult.suggestedActions,
      aiProvider: usedProvider,
      contextSummary: {
        firm_id,
        period,
        client_count: clients.length,
        target_client: targetClient?.display_name
      }
    };
  }
}
