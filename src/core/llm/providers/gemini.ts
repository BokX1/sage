
import { LLMClient, LLMRequest, LLMResponse, LLMRole } from '../types';
import { config } from '../../config/env';

export class GeminiClient implements LLMClient {
    private apiKey: string;
    private model: string;
    private baseUrl: string;

    constructor(options?: { apiKey?: string; model?: string; baseUrl?: string }) {
        this.apiKey = options?.apiKey || config.geminiApiKey || '';
        this.model = options?.model || config.geminiModel || 'gemini-2.0-flash-exp';
        this.baseUrl = options?.baseUrl || config.geminiBaseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    }

    async chat(request: LLMRequest): Promise<LLMResponse> {
        if (!this.apiKey) {
            throw new Error('Missing Gemini API Key');
        }

        const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

        // Map messages
        // Gemini separates system prompt into 'systemInstruction' or just prepends it if using older models.
        // We'll assume modern API support for systemInstruction.
        const systemMessage = request.messages.find(m => m.role === 'system');
        const conversationMessages = request.messages.filter(m => m.role !== 'system');

        const contents = conversationMessages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const body: any = {
            contents,
            generationConfig: {
                temperature: request.temperature,
                maxOutputTokens: request.maxTokens,
                responseMimeType: request.responseFormat === 'json_object' ? 'application/json' : 'text/plain',
            }
        };

        if (systemMessage) {
            body.systemInstruction = {
                parts: [{ text: systemMessage.content }]
            };
        }

        // Map tools - specifically looking for google_search
        if (request.tools && request.tools.length > 0) {
            const googleSearchTool = request.tools.find(t => t.type === 'google_search' || t.googleSearch);
            if (googleSearchTool) {
                body.tools = [{ googleSearch: {} }];
            }
        }

        // Also support manual tool passing if someone passes raw gemini tools
        if (request.tools && !body.tools) {
            // If not our special 'google_search' type, maybe pass through? 
            // For now, strict compliance with the prompt: "every main reply call must include Gemini's native search tool declaration internally"
            // The prompt says: "tools: include google_search"
        }

        // Handle toolChoice
        if (request.toolChoice === 'auto') {
            // Default behavior
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
            }

            const data = (await response.json()) as any;

            // Extract content
            // Gemini 1.5/2.0 response structure
            const candidate = data.candidates?.[0];
            const parts = candidate?.content?.parts;
            const text = parts?.map((p: any) => p.text).join('') || '';

            // Usage
            const usage = data.usageMetadata ? {
                promptTokens: data.usageMetadata.promptTokenCount || 0,
                completionTokens: data.usageMetadata.candidatesTokenCount || 0,
                totalTokens: data.usageMetadata.totalTokenCount || 0
            } : undefined;

            return {
                content: text,
                usage
            };

        } catch (error: any) {
            console.error('Gemini Chat Error:', error);
            throw error;
        }
    }
}
