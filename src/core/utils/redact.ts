import { config } from '../config/env';

const SENSITIVE_KEYS = [
    'DISCORD_TOKEN',
    'OPENAI_API_KEY',
    'POLLINATIONS_API_KEY',
    'DATABASE_URL',
    'authorization',
    'Authorization'
];

export function redact(text: string): string {
    if (!text) return text;
    let redacted = text;

    // Redact known config values if they exist
    const secrets = [
        config.discordToken,
        config.pollinationsApiKey,
        process.env.DATABASE_URL
    ].filter(Boolean) as string[];

    for (const secret of secrets) {
        if (secret.length < 8) continue; // Don't redact short common strings
        redacted = redacted.split(secret).join('[REDACTED]');
    }

    return redacted;
}

export function redactObj(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
        return obj.map(redactObj);
    }

    const newObj: any = {};
    for (const key in obj) {
        if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
            newObj[key] = '[REDACTED]';
        } else {
            newObj[key] = redactObj(obj[key]);
        }
    }
    return newObj;
}
