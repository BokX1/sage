
import { getLLMClient } from '../llm';
import { config } from '../config/env';

const UPDATE_SYSTEM_PROMPT = `You update a compact user profile summary for personalization.
Rules:
- Keep <= 800 characters.
- Store only stable preferences and non-sensitive facts that help future replies (tone preferences, formats, recurring interests).
- Do NOT store raw chat logs or transcripts.
- Do NOT store secrets, credentials, health/sexual/political identity, or anything sensitive.
- If nothing stable is learned, return the previous summary unchanged.
Output format: JSON exactly: {"summary":"..."}.`;

export async function updateProfileSummary(params: {
    previousSummary: string | null;
    userMessage: string;
    assistantReply: string;
}): Promise<string | null> {
    const { previousSummary, userMessage, assistantReply } = params;
    const client = getLLMClient();

    const prompt = `Current Summary: ${previousSummary || 'None'}

Latest Interaction:
User: ${userMessage}
Assistant: ${assistantReply}

Update the summary based on the new interaction.`;

    try {
        const isGeminiNative = config.llmProvider === 'gemini';

        const response = await client.chat({
            messages: [
                { role: 'system', content: UPDATE_SYSTEM_PROMPT },
                { role: 'user', content: prompt }
            ],
            model: isGeminiNative ? config.geminiModel : undefined,
            responseFormat: 'json_object',
            maxTokens: 1024,
            temperature: 0,
        });

        // Parse response
        let json: any;
        try {
            // Handle markdown json blocks if models output them
            const content = response.content.replace(/```json\n?|\n?```/g, '').trim();
            json = JSON.parse(content);
        } catch (e) {
            console.error('Failed to parse profile update JSON', e);
            return null;
        }

        if (json && typeof json.summary === 'string') {
            return json.summary;
        }
        return null;

    } catch (error) {
        console.error('Error updating profile:', error);
        return null;
    }
}
