import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { resetUnitOfWorkForTesting, MemoryUnitOfWork, getInitialSeedData } from '../src/repositories/index.js';
import { CopilotService } from '../src/services/ai/copilotService.js';
import { CopilotIntentService } from '../src/services/ai/copilotIntentService.js';
import { AIProvider } from '../src/services/ai/aiProvider.js';
import { GeminiProvider } from '../src/services/ai/geminiProvider.js';

class MockAIProvider implements AIProvider {
  readonly name = 'gemini';
  configured = true;
  shouldFail = false;
  malformed = false;
  lastPrompt?: string;
  lastSystemInstruction?: string;

  isConfigured(): boolean {
    return this.configured;
  }

  async generateResponse(prompt: string, systemInstruction?: string): Promise<string | null> {
    this.lastPrompt = prompt;
    this.lastSystemInstruction = systemInstruction;
    if (this.shouldFail || !this.configured) {
      return null;
    }
    if (this.malformed) {
      return '';
    }
    return `AI-Enhanced Analysis for Partner:\n\n${prompt.split('BASELINE VERIFIED ANSWER:\n')[1]?.split('\nPlease synthesize')[0] || 'Processed'}`;
  }
}

describe('CA Copilot AI Operations Assistant Backend', () => {
  let uow: MemoryUnitOfWork;
  let mockAi: MockAIProvider;
  let copilotServiceDeterministic: CopilotService;
  let copilotServiceWithAi: CopilotService;

  beforeEach(() => {
    const seed = getInitialSeedData();
    // Replace CLI-002 with Quantum Bridge to avoid duplicate client_id in memory seed
    const qbIdx = seed.clients.findIndex(c => c.client_id === 'CLI-002');
    const qbClient = {
      client_id: 'CLI-002',
      firm_id: 'FIR-001',
      legal_name: 'Quantum Bridge Technologies Private Limited',
      display_name: 'Quantum Bridge',
      entity_type: 'Private Limited' as const,
      primary_email: 'finance@quantumbridge.example',
      phone: '+91-9000000002',
      assigned_ca: 'CA Arun',
      active: true,
      created_at: '2026-01-01T09:00:00Z'
    };
    if (qbIdx >= 0) {
      seed.clients[qbIdx] = qbClient;
    } else {
      seed.clients.push(qbClient);
    }

    uow = new MemoryUnitOfWork(seed);
    resetUnitOfWorkForTesting(uow);

    mockAi = new MockAIProvider();
    copilotServiceDeterministic = new CopilotService(uow, new MockAIProvider());
    // @ts-expect-error test mock
    copilotServiceDeterministic['aiProvider'].configured = false;
    copilotServiceWithAi = new CopilotService(uow, mockAi);
  });

  // 1. Missing document query
  it('1. handles missing-document query and filters by document type and period', async () => {
    const res = await copilotServiceDeterministic.processQuery('FIR-001', 'Which clients haven\'t submitted their August bank statements?', '2026-08');
    expect(res.intent).toBe('GET_MISSING_DOCUMENTS');
    expect(res.grounded).toBe(true);
    expect(res.answer).toContain('missing document');
    expect(res.source).toContain('2026-08');
    expect(res.suggestedActions.length).toBeGreaterThan(0);
  });

  // 2. Client compliance query
  it('2. handles specific client compliance percentage inquiry with deterministic breakdown', async () => {
    const res = await copilotServiceDeterministic.processQuery('FIR-001', 'Why is Quantum Bridge only 60% compliant?', '2026-08');
    expect(res.intent).toBe('GET_CLIENT_COMPLIANCE');
    expect(res.contextSummary?.target_client).toBe('Quantum Bridge');
    expect(res.answer).toContain('Quantum Bridge');
    expect(res.answer).toContain('Compliance Breakdown');
    expect(res.grounded).toBe(true);
  });

  // 3. Client summary query
  it('3. generates structured client summary for a recognized client entity', async () => {
    const res = await copilotServiceDeterministic.processQuery('FIR-001', 'Summarize Quantum Bridge');
    expect(res.intent).toBe('GET_CLIENT_SUMMARY');
    expect(res.contextSummary?.target_client).toBe('Quantum Bridge');
    expect(res.answer).toContain('Quantum Bridge Technologies Private Limited');
    expect(res.answer).toContain('CLI-002');
  });

  // 4. Pending reminder query
  it('4. reports staged reminder drafts pending partner approval', async () => {
    const res = await copilotServiceDeterministic.processQuery('FIR-001', 'Which reminders are pending approval?');
    expect(res.intent).toBe('GET_PENDING_REMINDERS');
    expect(res.answer).toBeDefined();
    expect(res.grounded).toBe(true);
  });

  // 5. Open alerts query
  it('5. reports active open compliance alerts and exceptions', async () => {
    const res = await copilotServiceDeterministic.processQuery('FIR-001', 'Which clients have open alerts?');
    expect(res.intent).toBe('GET_OPEN_ALERTS');
    expect(res.answer).toContain('alert');
  });

  // 6. Attention items query
  it('6. summarizes daily operational priorities for CA partner', async () => {
    const res = await copilotServiceDeterministic.processQuery('FIR-001', 'What needs my attention today?');
    expect(res.intent).toBe('GET_ATTENTION_ITEMS');
    expect(res.answer).toContain('Operational Attention Summary');
    expect(res.answer).toContain('Missing Documents');
  });

  // 7. Unknown client handling
  it('7. gracefully handles inquiry about unknown/unregistered client', async () => {
    const res = await copilotServiceDeterministic.processQuery('FIR-001', 'Summarize NonExistentClientXYZ Corp');
    expect(res.answer).toContain('Could not identify the requested client entity');
    expect(res.grounded).toBe(true);
  });

  // 8. Empty / no-data query response
  it('8. gracefully handles empty query string', async () => {
    const res = await copilotServiceDeterministic.processQuery('FIR-001', '   ');
    expect(res.intent).toBe('GENERAL_COPILOT_QUERY');
    expect(res.answer).toContain('Please provide a question');
  });

  // 9. Firm scoping verification
  it('9. enforces strict firm scoping to FIR-001', async () => {
    const res = await copilotServiceDeterministic.processQuery('FIR-001', 'What needs my attention today?');
    expect(res.contextSummary?.firm_id).toBe('FIR-001');
    expect(res.answer).toContain('Vertex & Associates');
  });

  // 10. AI provider unavailable fallback
  it('10. falls back cleanly to deterministic response when AI provider is unconfigured', async () => {
    mockAi.configured = false;
    const res = await copilotServiceWithAi.processQuery('FIR-001', 'What needs my attention today?');
    expect(res.aiProvider).toBe('deterministic');
    expect(res.answer).toContain('Operational Attention Summary');
    expect(res.grounded).toBe(true);
  });

  // 11. Malformed AI output handling
  it('11. falls back to deterministic answer if AI provider returns empty/malformed text', async () => {
    mockAi.malformed = true;
    const res = await copilotServiceWithAi.processQuery('FIR-001', 'What needs my attention today?');
    expect(res.aiProvider).toBe('deterministic');
    expect(res.answer).toContain('Operational Attention Summary');
  });

  // 12. Reminder drafting does not send or mutate records
  it('12. drafting a reminder prepares draft text and DOES NOT send email or mutate reminders table', async () => {
    const remindersBefore = await uow.reminders.findAll('FIR-001');
    const sentBefore = remindersBefore.filter(r => r.status === 'Sent').length;

    const res = await copilotServiceDeterministic.processQuery('FIR-001', 'Draft a reminder for clients missing payroll summaries');
    expect(res.intent).toBe('DRAFT_REMINDER');
    expect(res.answer).toContain('Draft Client Reminder Generated');
    expect(res.answer).toContain('Subject');
    expect(res.answer).toContain('CA Copilot will never autonomously dispatch emails');

    // Confirm no reminders were mutated to Sent
    const remindersAfter = await uow.reminders.findAll('FIR-001');
    const sentAfter = remindersAfter.filter(r => r.status === 'Sent').length;
    expect(sentAfter).toBe(sentBefore);
  });

  // 13. AI Enhancement Mode
  it('13. uses AI provider when configured and provides grounded synthesis with quantitative preservation instruction', async () => {
    const res = await copilotServiceWithAi.processQuery('FIR-001', 'What needs my attention today?');
    expect(res.aiProvider).toBe('gemini');
    expect(mockAi.lastPrompt).toContain('AUTHORITATIVE PRACTICE FACTS:');
    expect(mockAi.lastPrompt).toContain('BASELINE VERIFIED ANSWER:');
    expect(mockAi.lastSystemInstruction).toContain('You must preserve every authoritative quantitative fact exactly as provided.');
    expect(mockAi.lastSystemInstruction).toContain('Never output an empty metric heading');
    expect(mockAi.lastPrompt).toContain('You must preserve every authoritative quantitative fact');
  });

  // 14. HTTP Integration Test on POST /api/v1/copilot/chat
  it('14. HTTP POST /api/v1/copilot/chat returns structured grounded JSON response', async () => {
    const res = await request(app)
      .post('/api/v1/copilot/chat')
      .set('x-firm-id', 'FIR-001')
      .send({ message: 'What needs my attention today?' });

    expect(res.status).toBe(200);
    expect(res.body.data.intent).toBe('GET_ATTENTION_ITEMS');
    expect(res.body.data.grounded).toBe(true);
    expect(res.body.data.answer).toBeDefined();
    expect(Array.isArray(res.body.data.suggestedActions)).toBe(true);
  });

  // 15. HTTP rejection on empty message
  it('15. HTTP POST /api/v1/copilot/chat rejects empty message with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/copilot/chat')
      .set('x-firm-id', 'FIR-001')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });

  // 16. GeminiProvider HTTP Header and Model Verification
  it('16. GeminiProvider sends x-goog-api-key header and uses gemini-3.5-flash endpoint', async () => {
    let capturedUrl = '';
    let capturedHeaders: Record<string, string> = {};

    const originalFetch = globalThis.fetch;
    // @ts-expect-error mock fetch
    globalThis.fetch = vi.fn(async (url: string, init?: RequestInit) => {
      capturedUrl = url;
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Grounded response from Gemini' }] } }]
        })
      };
    });

    try {
      const provider = new GeminiProvider('test_secret_key_123');
      expect(provider.isConfigured()).toBe(true);
      const text = await provider.generateResponse('Hello Gemini');
      expect(text).toBe('Grounded response from Gemini');
      expect(capturedUrl).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent');
      expect(capturedUrl).not.toContain('key=');
      expect(capturedHeaders['x-goog-api-key']).toBe('test_secret_key_123');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 17. GeminiProvider handles HTTP error status code cleanly
  it('17. GeminiProvider gracefully returns null on HTTP error (e.g. 404)', async () => {
    const originalFetch = globalThis.fetch;
    // @ts-expect-error mock fetch
    globalThis.fetch = vi.fn(async () => {
      return {
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'Model not found' } })
      };
    });

    try {
      const provider = new GeminiProvider('test_secret_key');
      const text = await provider.generateResponse('Hello Gemini');
      expect(text).toBeNull();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 18. GeminiProvider returns null when unconfigured
  it('18. GeminiProvider is unconfigured when API key is missing or empty', async () => {
    const providerEmpty = new GeminiProvider('');
    expect(providerEmpty.isConfigured()).toBe(false);
    expect(await providerEmpty.generateResponse('test')).toBeNull();

    const providerUndefined = new GeminiProvider(undefined);
    expect(providerUndefined.isConfigured()).toBe(false);
    expect(await providerUndefined.generateResponse('test')).toBeNull();
  });

  // 19. Pure greetings classified as GREETING
  it('19. pure greetings (hi, hello, good morning, thanks) are classified as GREETING', async () => {
    const p1 = CopilotIntentService.parse('hi', []);
    expect(p1.intent).toBe('GREETING');

    const p2 = CopilotIntentService.parse('hello', []);
    expect(p2.intent).toBe('GREETING');

    const p3 = CopilotIntentService.parse('good morning', []);
    expect(p3.intent).toBe('GREETING');

    const p4 = CopilotIntentService.parse('thanks', []);
    expect(p4.intent).toBe('GREETING');
  });

  // 20. Operational queries with greeting prefix are NOT classified as GREETING
  it('20. operational queries containing greeting words are NOT classified as GREETING', async () => {
    const p1 = CopilotIntentService.parse('hi, why is Quantum Bridge only 60% compliant?', []);
    expect(p1.intent).toBe('GET_CLIENT_COMPLIANCE');
    expect(p1.intent).not.toBe('GREETING');

    const p2 = CopilotIntentService.parse('thanks, which clients are missing bank statements?', []);
    expect(p2.intent).toBe('GET_MISSING_DOCUMENTS');
    expect(p2.intent).not.toBe('GREETING');

    const p3 = CopilotIntentService.parse('good morning, what needs my attention today?', []);
    expect(p3.intent).toBe('GET_ATTENTION_ITEMS');
    expect(p3.intent).not.toBe('GREETING');
  });

  // 21. Greetings return clean conversational response and bypass Gemini
  it('21. greeting queries bypass GeminiProvider and return clean deterministic conversational greeting', async () => {
    mockAi.lastPrompt = undefined;
    const res = await copilotServiceWithAi.processQuery('FIR-001', 'hi');

    expect(res.intent).toBe('GREETING');
    expect(res.aiProvider).toBe('deterministic');
    expect(res.answer).toContain('Good day, Partner.');
    expect(res.answer).toContain('How can I help you with practice operations today?');
    // Verify GeminiProvider was NOT called
    expect(mockAi.lastPrompt).toBeUndefined();
  });
});
