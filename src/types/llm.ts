/**
 * LLM provider types
 */

export interface AnalyzeRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens?: number;
  model: string;
}

export interface AnalyzeResponse {
  content: string;
  usage?: TokenUsage;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMProvider {
  name: string;
  analyze(request: AnalyzeRequest): Promise<AnalyzeResponse>;
  healthCheck(): Promise<boolean>;
}
