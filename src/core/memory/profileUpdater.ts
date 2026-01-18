import { getLLMClient } from '../llm';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { LLMClient, LLMChatMessage, LLMRequest } from '../llm/types';

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

    const json = await tryChat(
      client,
      [
        { role: 'system', content: UPDATE_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      isGeminiNative,
      false, // Initial attempt, no retry yet
    );

    if (json && typeof json.summary === 'string') {
      return json.summary;
    }
    return null;
  } catch (error) {
    logger.error({ error }, 'Error updating profile');
    return null;
  }
}

async function tryChat(
  client: LLMClient,
  messages: LLMChatMessage[],
  isNative: boolean,
  retry: boolean,
): Promise<{ summary?: string } | null> {
  const config = (await import('../config/env')).config;

  // First attempt: JSON Check (or Retry with Strong Prompt)
  const payload: LLMRequest = {
    messages,
    model: isNative ? config.geminiModel : undefined,
    responseFormat: retry ? undefined : 'json_object', // Disable json_object on retry
    maxTokens: 1024,
    temperature: 0,
  };

  if (retry) {
    // Append strict instruction
    const strict =
      '\n\nIMPORTANT: Output ONLY valid JSON. No markdown. No text. Example: {"summary": "..."}';
    const last = messages[messages.length - 1];
    if (last) {
      payload.messages = [
        ...messages.slice(0, -1),
        { role: last.role, content: last.content + strict },
      ];
    }
  }

  const response = await client.chat(payload);
  const content = response.content.replace(/```json\n?|\n?```/g, '').trim();

  // Validate JSON
  try {
    const json = JSON.parse(content);
    return json;
  } catch (e) {
    logger.debug({ error: e }, 'JSON Parse Error in profile update');
    if (!retry) {
      // RETRY ONCE
      logger.warn('Profile Update: Invalid JSON received. Retrying with shim...');
      return tryChat(client, messages, isNative, true);
    }
    throw e;
  }
}
