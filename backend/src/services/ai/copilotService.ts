import { IUnitOfWork } from '../../repositories/interfaces.js';
import { Firm } from '../../types/domain.js';
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

    // 1. Fetch Authoritative Data from Unit of Work
    const firm: Firm = (await this.uow.firms.findById(firm_id)) || {
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

    const clients = await this.uow.clients.findAll(firm_id);
    const documents = await this.uow.documents.findAll(firm_id);
    const alerts = await this.uow.alerts.findAll(firm_id);
    const reminders = await this.uow.reminders.findAll(firm_id);

    // 2. Parse Intent and Entities
    const parsed = CopilotIntentService.parse(userMessage, clients, overridePeriod || '2026-08');
    const period = parsed.period;

    // 3. Compute Deterministic Compliance and Dashboard Metrics
    const { matrix, summary: complianceSummary } = await this.complianceEngine.evaluateCompliance(firm_id, period);
    const dashboardData = await this.dashboardService.getDashboardData(firm_id, period);

    const targetClient = parsed.targetClientId 
      ? clients.find(c => c.client_id === parsed.targetClientId) 
      : undefined;

    // 4. Handle Specific Logic for DRAFT_REMINDER if requested
    let draftedReminder: CopilotFactualContext['draftedReminder'] | undefined = undefined;
    if (parsed.intent === 'DRAFT_REMINDER') {
      let clientForDraft = targetClient;
      let missingForClient = matrix.filter(m => m.status === 'Missing');

      if (parsed.documentType) {
        missingForClient = missingForClient.filter(m => m.document_type.toLowerCase() === parsed.documentType?.toLowerCase());
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
          body: `Dear ${clientForDraft.display_name} Team,\n\nThis is a friendly reminder from Vertex & Associates regarding your statutory filing compliance for period ${period}.\n\nAccording to our records, the following document(s) are currently outstanding:\n${missingNames.map(n => `• ${n}`).join('\n')}\n\nPlease submit these files at your earliest convenience to avoid statutory interest or late filing penalties.\n\nWarm regards,\n${clientForDraft.assigned_ca || 'CA Arun'}\nVertex & Associates, Chartered Accountants`,
          missing_items: missingNames
        };
      }
    }

    // 5. Build Structured Factual Context
    const factualContext: CopilotFactualContext = {
      intent: parsed.intent,
      parsed,
      firm,
      period,
      clients,
      documents,
      alerts,
      reminders,
      matrix,
      complianceSummary,
      attentionMetrics: dashboardData.attention_metrics,
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
3. Keep answers concise, highly structured, professional, and easy for a CA Partner to scan.
4. If information is not in the facts, state clearly that it is not recorded in the practice database.
5. Use markdown formatting (bolding, bullet points) cleanly.`;

      const prompt = `USER QUESTION: "${userMessage}"

AUTHORITATIVE PRACTICE FACTS:
- Firm: ${firm.legal_name} (Firm ID: ${firm.firm_id})
- Evaluation Period: ${period}
- Total Active Clients: ${clients.length}
- Target Client: ${targetClient ? `${targetClient.legal_name} (${targetClient.client_id})` : 'None specified'}
- Compliance Score (Period ${period}): ${complianceSummary.on_track_percentage}% (${complianceSummary.on_track} on track, ${complianceSummary.missing} missing, ${complianceSummary.needs_review} needs review)
- Missing Documents Count: ${dashboardData.attention_metrics.missing_documents}
- Review Required Inbound Items: ${dashboardData.attention_metrics.needs_review}
- Open Alerts Count: ${alerts.filter(a => a.status === 'Open').length}
- Pending Reminders Count: ${reminders.filter(r => r.status === 'Pending Approval').length}

BASELINE VERIFIED ANSWER:
${deterministicResult.answer}

Please synthesize a grounded, professional response based strictly on these facts.`;

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
