import { config } from '../config/env';
import { LLMClient, LLMProviderName } from './types';
import { PollinationsClient } from './providers/pollinations';

let instance: LLMClient | null = null;

export function getLLMClient(): LLMClient {
    if (instance) return instance;

    const provider = (config.llmProvider || 'pollinations') as LLMProviderName;

    switch (provider) {
        case 'pollinations':
            instance = new PollinationsClient({
                baseUrl: config.pollinationsBaseUrl,
                apiKey: config.pollinationsApiKey,
                model: config.pollinationsModel,
            });
            break;
        case 'gemini':
            const { GeminiClient } = require('./providers/gemini');
            instance = new GeminiClient({
                apiKey: config.geminiApiKey,
                model: config.geminiModel,
                baseUrl: config.geminiBaseUrl
            });
            break;
        default:
            // Fallback or no-op if no provider
            console.warn(`Unknown or unset LLM_PROVIDER (${provider}), defaulting to Pollinations`);
            instance = new PollinationsClient();
            break;
    }

    return instance!;
}
