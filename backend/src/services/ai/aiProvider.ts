export interface AIProvider {
  readonly name: string;
  isConfigured(): boolean;
  generateResponse(prompt: string, systemInstruction?: string): Promise<string | null>;
}
