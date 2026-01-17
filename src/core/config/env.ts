import dotenv from 'dotenv';
dotenv.config();

export const config = {
    discordToken: process.env.DISCORD_TOKEN || '',
    discordAppId: process.env.DISCORD_APP_ID || '',
    logLevel: process.env.LOG_LEVEL || 'info',
    rateLimitMax: process.env.RATE_LIMIT_MAX,
    rateLimitWindowSec: process.env.RATE_LIMIT_WINDOW_SEC,
    seriousMode: process.env.SERIOUS_MODE,
    autopilotLevel: process.env.AUTOPILOT_LEVEL,
    silenceGraceSec: process.env.SILENCE_GRACE_SEC,
    // LLM Config - Pollinations is the default provider
    llmProvider: process.env.LLM_PROVIDER || 'pollinations',
    pollinationsBaseUrl: process.env.POLLINATIONS_BASE_URL || 'https://gen.pollinations.ai/v1',
    pollinationsApiKey: process.env.POLLINATIONS_API_KEY, // Optional - only if required by endpoint
    pollinationsModel: process.env.POLLINATIONS_MODEL || 'gemini',

    // Gemini Config
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    geminiBaseUrl: process.env.GEMINI_BASE_URL,
};
