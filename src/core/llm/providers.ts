/**
 * LLM Provider implementations
 * Supports Ollama, vLLM, llama.cpp, and OpenAI-compatible APIs
 */

import type { LLMProvider, AnalyzeRequest, AnalyzeResponse } from '../../types/llm.js';
import type { LLMConfig } from '../../types/config.js';
import { LLMError, ConfigError } from '../../utils/errors.js';
import { validateEndpoint } from '../../utils/network-validator.js';
import { createSecureFetch } from '../../utils/network-validator.js';

/**
 * Ollama Provider
 */
export class OllamaProvider implements LLMProvider {
  public readonly name = 'ollama';
  private readonly secureFetch: ReturnType<typeof createSecureFetch>;

  constructor(
    private readonly endpoint: string,
    _apiKey?: string,
    allowedHosts: string[] = ['localhost', '127.0.0.1', '::1']
  ) {
    validateEndpoint(endpoint, allowedHosts);
    this.secureFetch = createSecureFetch(allowedHosts);
  }

  async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    const url = `${this.endpoint}/api/generate`;
    const response = await this.secureFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        prompt: `${request.systemPrompt}\n\n${request.userPrompt}`,
        temperature: request.temperature,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new LLMError(`Ollama request failed: ${response.statusText}`, {
        status: response.status,
        error: errorText,
      });
    }

    const data = (await response.json()) as {
      response: string;
      prompt_eval_count?: number;
      eval_count?: number;
    };

    return {
      content: data.response,
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.endpoint}/api/tags`;
      const response = await this.secureFetch(url, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * vLLM Provider (OpenAI-compatible completions endpoint)
 */
export class VLLMProvider implements LLMProvider {
  public readonly name = 'vllm';
  private readonly secureFetch: ReturnType<typeof createSecureFetch>;

  constructor(
    private readonly endpoint: string,
    private readonly apiKey?: string,
    allowedHosts: string[] = ['localhost', '127.0.0.1', '::1']
  ) {
    validateEndpoint(endpoint, allowedHosts);
    this.secureFetch = createSecureFetch(allowedHosts);
  }

  async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    const url = `${this.endpoint}/v1/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await this.secureFetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: request.model,
        prompt: `${request.systemPrompt}\n\n${request.userPrompt}`,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new LLMError(`vLLM request failed: ${response.statusText}`, {
        status: response.status,
        error: errorText,
      });
    }

    const data = (await response.json()) as {
      choices: Array<{ text: string }>;
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };

    if (!data.choices || data.choices.length === 0) {
      throw new LLMError('No response from vLLM provider', { response: data });
    }

    return {
      content: data.choices[0]?.text || '',
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.endpoint}/health`;
      const response = await this.secureFetch(url, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * llama.cpp server Provider
 */
export class LlamaCppProvider implements LLMProvider {
  public readonly name = 'llamacpp';
  private readonly secureFetch: ReturnType<typeof createSecureFetch>;

  constructor(
    private readonly endpoint: string,
    _apiKey?: string,
    allowedHosts: string[] = ['localhost', '127.0.0.1', '::1']
  ) {
    validateEndpoint(endpoint, allowedHosts);
    this.secureFetch = createSecureFetch(allowedHosts);
  }

  async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    const url = `${this.endpoint}/completion`;
    const response = await this.secureFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `${request.systemPrompt}\n\n${request.userPrompt}`,
        temperature: request.temperature,
        n_predict: request.maxTokens || 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new LLMError(`llama.cpp request failed: ${response.statusText}`, {
        status: response.status,
        error: errorText,
      });
    }

    const data = (await response.json()) as {
      content?: string;
      tokens_evaluated?: number;
      tokens_predicted?: number;
    };

    if (!data.content) {
      throw new LLMError('No response from llama.cpp provider', { response: data });
    }

    return {
      content: data.content,
      usage: {
        promptTokens: data.tokens_evaluated || 0,
        completionTokens: data.tokens_predicted || 0,
        totalTokens: (data.tokens_evaluated || 0) + (data.tokens_predicted || 0),
      },
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.endpoint}/health`;
      const response = await this.secureFetch(url, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Generic OpenAI-compatible Provider (for LM Studio, LocalAI, etc.)
 */
export class OpenAICompatibleProvider implements LLMProvider {
  public readonly name = 'openai-compatible';
  private readonly secureFetch: ReturnType<typeof createSecureFetch>;

  constructor(
    private readonly endpoint: string,
    private readonly apiKey?: string,
    allowedHosts: string[] = ['localhost', '127.0.0.1', '::1']
  ) {
    validateEndpoint(endpoint, allowedHosts);
    this.secureFetch = createSecureFetch(allowedHosts);
  }

  async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    const url = `${this.endpoint}/v1/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await this.secureFetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: request.model,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userPrompt },
        ],
        temperature: request.temperature,
        max_tokens: request.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new LLMError(`OpenAI-compatible request failed: ${response.statusText}`, {
        status: response.status,
        error: errorText,
      });
    }

    const data = (await response.json()) as {
      choices: Array<{
        message: {
          content: string;
        };
      }>;
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };

    if (!data.choices || data.choices.length === 0) {
      throw new LLMError('No response from OpenAI-compatible provider', { response: data });
    }

    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.endpoint}/v1/models`;
      const response = await this.secureFetch(url, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Provider Factory
 */
export function createLLMProvider(config: LLMConfig): LLMProvider {
  const { provider, endpoint, apiKey } = config;

  // SECURITY: Validate endpoint is localhost only
  const allowedHosts = ['localhost', '127.0.0.1', '::1'];
  validateEndpoint(endpoint, allowedHosts);

  switch (provider) {
    case 'ollama':
      return new OllamaProvider(endpoint, apiKey, allowedHosts);
    case 'vllm':
      return new VLLMProvider(endpoint, apiKey, allowedHosts);
    case 'llamacpp':
      return new LlamaCppProvider(endpoint, apiKey, allowedHosts);
    case 'openai-compatible':
      return new OpenAICompatibleProvider(endpoint, apiKey, allowedHosts);
    default:
      throw new ConfigError(`Unknown LLM provider: ${provider}`);
  }
}
