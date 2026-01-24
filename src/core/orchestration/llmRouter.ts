import { ExpertName } from './experts/types';
import { createLLMClient } from '../llm';
import { LLMChatMessage } from '../llm/types';
import { logger } from '../utils/logger';

// Router model: gemini-fast for low-cost, high-throughput classification
const ROUTER_MODEL = 'gemini-fast';
const ROUTER_TEMPERATURE = 0.1;
const ROUTER_TIMEOUT_MS = 45_000;

export type RouteKind =
    | 'summarize'
    | 'qa'
    | 'admin'
    | 'voice_analytics'
    | 'social_graph'
    | 'memory'
    | 'image_generate';

export interface RouteDecision {
    kind: RouteKind;
    experts: ExpertName[];
    allowTools: boolean;
    temperature: number;
    reasoningText?: string;
}

export interface LLMRouterParams {
    userText: string;
    invokedBy: 'mention' | 'reply' | 'wakeword' | 'autopilot' | 'command';
    hasGuild: boolean;
    conversationHistory?: LLMChatMessage[];
    apiKey?: string;
}

const ROUTER_SYSTEM_PROMPT = `You are an intent classifier for a Discord bot called Sage.

primary_directive: "Analyze the user's LATEST message to determine the immediate intent. Use conversation history ONLY to resolve references (e.g., 'it', 'him', 'that') or for direct follow-up questions. If the user changes the topic, prioritize the new topic over historical context."

## Available Routes

| Route | Keywords & Signals | Experts |
|-------|-------------------|---------|
| summarize | "summarize", "recap", "tl;dr", "what happened", "catch me up" | Summarizer, Memory |
| image_generate | "draw", "generate", "paint", "create an image", "make a picture", "visualize", "turn this into art" | ImageGenerator |
| voice_analytics | "who is in voice", "voice stats", "how long have they been", "vc status" | VoiceAnalytics, Memory |
| social_graph | "who knows whom", "relationship", "friendship", "connection", "vibe check" | SocialGraph, Memory |
| memory | "what do you know about me", "my profile", "forget me", "what do you remember" | Memory |
| admin | Slash commands, "configure", "settings", "debug" | SocialGraph, VoiceAnalytics, Memory |
| qa | General chat, coding questions, "how to", "why", greetings, banter, insults | Memory |

## Decision Logic

1. **Explicit Intent**: If the user explicitly asks for a function (e.g., "draw a cat"), map to that route immediately.
2. **Multi-Expert**: If the request needs diverse data (e.g. "who is in voice and what are they talking about?"), select ALL relevant experts (VoiceAnalytics + Summarizer).
3. **Context Resolution**: If the user says "make NOISE", check history. If previous msg was "voice channel", route to voice_analytics. If previous was "image", route to image_generate.
4. **Fallback**: If the input is ambiguous, conversational, or a generic question, default to 'qa'.

## Output Format

Return STRICT JSON:
{
  "route": "<route_kind>",
  "experts": ["<Expert1>", "<ExpertName2>"],
  "reasoning": "User asked X, implying Y intent.",
  "temperature": <0.0-1.0>
}

Valid Experts: Summarizer, SocialGraph, Memory, VoiceAnalytics, ImageGenerator`;

const DEFAULT_QA_ROUTE: RouteDecision = {
    kind: 'qa',
    experts: ['Memory'],
    allowTools: true,
    temperature: 0.8,
    reasoningText: 'Default Q&A route (fallback)',
};

interface RouterLLMResponse {
    route?: string;
    experts?: string[];
    reasoning?: string;
    temperature?: number;
}

/**
 * LLM-based intent classifier.
 * Uses Gemini Flash Lite for low-cost, contextual routing.
 */
export async function decideRoute(params: LLMRouterParams): Promise<RouteDecision> {
    const { userText, invokedBy, hasGuild, conversationHistory, apiKey } = params;

    // Fast path: admin route for slash commands
    if (invokedBy === 'command' && hasGuild) {
        return {
            kind: 'admin',
            experts: ['SocialGraph', 'VoiceAnalytics', 'Memory'],
            allowTools: true,
            temperature: 0.4,
            reasoningText: 'Slash command context detected',
        };
    }

    try {
        const client = createLLMClient('pollinations', { pollinationsModel: ROUTER_MODEL });

        // Build messages with conversation history
        const messages: LLMChatMessage[] = [
            { role: 'system', content: ROUTER_SYSTEM_PROMPT },
        ];

        // Add conversation history (last 7 messages for context)
        if (conversationHistory && conversationHistory.length > 0) {
            const historySlice = conversationHistory.slice(-7);
            const historyText = historySlice
                .map((m) => `${m.role}: ${typeof m.content === 'string' ? m.content : '[media]'}`)
                .join('\n');
            messages.push({
                role: 'user',
                content: `## Conversation History (for context)\n${historyText}\n\n## Current Message\n${userText}`,
            });
        } else {
            messages.push({ role: 'user', content: userText });
        }

        const response = await client.chat({
            messages,
            model: ROUTER_MODEL,
            apiKey,
            temperature: ROUTER_TEMPERATURE,
            timeout: ROUTER_TIMEOUT_MS,
            responseFormat: 'json_object',
        });

        // Parse JSON response
        const parsed = parseRouterResponse(response.content);

        if (!parsed) {
            logger.warn({ responseContent: response.content }, 'Router: Failed to parse LLM response');
            return DEFAULT_QA_ROUTE;
        }

        // Validate route kind
        const validRoutes: RouteKind[] = ['summarize', 'qa', 'admin', 'voice_analytics', 'social_graph', 'memory', 'image_generate'];
        const routeKind = validRoutes.includes(parsed.route as RouteKind)
            ? (parsed.route as RouteKind)
            : 'qa';

        // Validate experts
        const validExperts: ExpertName[] = ['Summarizer', 'SocialGraph', 'Memory', 'VoiceAnalytics', 'ImageGenerator'];
        const experts = (parsed.experts || ['Memory'])
            .filter((e): e is ExpertName => validExperts.includes(e as ExpertName));

        if (experts.length === 0) {
            experts.push('Memory');
        }

        // Determine allowTools based on route
        const allowTools = routeKind === 'qa' || routeKind === 'admin';

        // Use provided temperature or route-based default
        const temperature = typeof parsed.temperature === 'number'
            ? Math.min(Math.max(parsed.temperature, 0), 1)
            : getDefaultTemperature(routeKind);

        const decision: RouteDecision = {
            kind: routeKind,
            experts,
            allowTools,
            temperature,
            reasoningText: parsed.reasoning || `LLM classified as ${routeKind}`,
        };

        logger.debug({ decision, userText: userText.slice(0, 50) }, 'Router: LLM decision');
        return decision;

    } catch (error) {
        logger.warn({ error }, 'Router: LLM call failed, using default route');
        return DEFAULT_QA_ROUTE;
    }
}

function parseRouterResponse(content: string): RouterLLMResponse | null {
    try {
        // Try direct parse
        const parsed = JSON.parse(content);
        return parsed;
    } catch {
        // Try extracting JSON from code block
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[1].trim());
            } catch {
                return null;
            }
        }

        // Try finding JSON object
        const objectMatch = content.match(/\{[\s\S]*\}/);
        if (objectMatch) {
            try {
                return JSON.parse(objectMatch[0]);
            } catch {
                return null;
            }
        }

        return null;
    }
}

function getDefaultTemperature(route: RouteKind): number {
    switch (route) {
        case 'summarize': return 0.3;
        case 'voice_analytics': return 0.5;
        case 'social_graph': return 0.5;
        case 'memory': return 0.6;
        case 'admin': return 0.4;
        case 'qa': return 0.8;
        default: return 0.8;
    }
}
