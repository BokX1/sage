export type LLMRole = 'system' | 'user' | 'assistant';

export interface LLMChatMessage {
  role: LLMRole;
  content: string;
}

export interface LLMRequest {
  messages: LLMChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json_object';
  tools?: any[];
  toolChoice?: string | any;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMClient {
  chat(request: LLMRequest): Promise<LLMResponse>;
}

export type LLMProviderName = 'pollinations'; // Pollinations-only runtime
