import { config } from '../config/env';
import { LLMClient, LLMProviderName } from './types';
import { PollinationsClient } from './providers/pollinations';
import { logger } from '../utils/logger';

let instance: LLMClient | null = null;

export function getLLMClient(): LLMClient {
  if (instance) return instance;

  const provider = (config.llmProvider || 'pollinations') as LLMProviderName;

  instance = createLLMClient(provider);

  return instance!;
}

export interface LLMClientOptions {
  pollinationsModel?: string;
}

export function createLLMClient(provider: LLMProviderName, opts?: LLMClientOptions): LLMClient {
  switch (provider) {
    case 'pollinations':
      return new PollinationsClient({
        baseUrl: config.pollinationsBaseUrl,
        apiKey: config.pollinationsApiKey,
        model: opts?.pollinationsModel ?? config.pollinationsModel,
      });
    default:
      // Fallback for any unknown provider
      logger.warn({ provider }, 'Unknown or unset LLM_PROVIDER, defaulting to Pollinations');
      return new PollinationsClient();
  }
}
