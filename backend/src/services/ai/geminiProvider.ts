import { AIProvider } from './aiProvider.js';

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private apiKey?: string;
  private modelName: string;

  constructor(apiKey?: string, modelName = 'gemini-3.5-flash') {
    this.apiKey = apiKey && apiKey.trim().length > 0 ? apiKey.trim() : undefined;
    this.modelName = modelName;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generateResponse(prompt: string, systemInstruction?: string): Promise<string | null> {
    if (!this.apiKey) {
      return null;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent`;
    
    const body: Record<string, unknown> = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 1024
      }
    };

    if (systemInstruction) {
      body.system_instruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!response.ok) {
        console.warn(`[GeminiProvider] API request returned status ${response.status}`);
        return null;
      }

      const data = await response.json() as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };

      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidateText && typeof candidateText === 'string') {
        return candidateText.trim();
      }

      return null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[GeminiProvider] Request failed: ${msg}`);
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
