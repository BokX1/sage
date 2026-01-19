import { getLLMClient, createLLMClient } from '../llm';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { LLMClient, LLMChatMessage, LLMRequest, LLMProviderName } from '../llm/types';

const UPDATE_SYSTEM_PROMPT = `You update a compact user profile summary for personalization.
Rules:
- Keep <= 800 characters.
- Store ONLY stable preferences and facts (e.g. "Favorite color is blue", "Lives in Paris", "Likes sci-fi").
- Do NOT store raw chat logs, "User said", or "Assistant replied".
- Do NOT store secrets, credentials, or PII.
- If nothing new/stable is learned, return the previous summary unchanged.
- ALWAYS return a JSON object, even if summary is unchanged; never return plain text.
Output format: JSON exactly: {"summary":"..."}.`;

// Cached profile client
let profileClientCache: { client: LLMClient; provider: LLMProviderName } | null = null;

/**
 * Get the LLM client for profile updates.
 * Uses PROFILE_PROVIDER and PROFILE_POLLINATIONS_MODEL overrides if configured.
 */
function getProfileClient(): { client: LLMClient; provider: LLMProviderName } {
  if (profileClientCache) {
    return profileClientCache;
  }

  const profileProvider = config.profileProvider?.trim() || '';
  const profilePollinationsModel = config.profilePollinationsModel?.trim() || '';

  // If no overrides at all, use default client
  if (!profileProvider && !profilePollinationsModel) {
    profileClientCache = {
      client: getLLMClient(),
      provider: config.llmProvider as LLMProviderName,
    };
    return profileClientCache;
  }

  // Determine provider (use override or fallback to default)
  const provider = (profileProvider || config.llmProvider) as LLMProviderName;

  // Build model overrides (Pollinations only)
  const opts: { pollinationsModel?: string } = {};
  if (profilePollinationsModel) {
    opts.pollinationsModel = profilePollinationsModel;
  }

  profileClientCache = {
    client: createLLMClient(provider, opts),
    provider,
  };

  logger.debug(
    { provider, pollinationsModel: opts.pollinationsModel },
    'Profile updater using dedicated client',
  );

  return profileClientCache;
}

export async function updateProfileSummary(params: {
  previousSummary: string | null;
  userMessage: string;
  assistantReply: string;
}): Promise<string | null> {
  const { previousSummary, userMessage, assistantReply } = params;
  const { client, provider } = getProfileClient();

  const prompt = `Current Summary: ${previousSummary || 'None'}

Latest Interaction:
User: ${userMessage}
Assistant: ${assistantReply}

Update the summary based on the new interaction.`;

  try {
    const json = await tryChat(
      client,
      [
        { role: 'system', content: UPDATE_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      provider,
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

/**
 * Extract a balanced JSON object from a string.
 * - First tries to extract from ```json ... ``` code blocks.
 * - Then scans for the first '{' and tracks brace depth to find the matching '}'.
 * - Correctly ignores braces inside JSON strings (handles \" and \\ escapes).
 */
export function extractBalancedJson(content: string): string | null {
  // 1. Try extracting from code blocks first
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    const inner = codeBlockMatch[1].trim();
    // Validate there's a { in the code block
    if (inner.includes('{')) {
      return extractFirstJsonObject(inner);
    }
  }

  // 2. Extract first balanced JSON object
  return extractFirstJsonObject(content);
}

/**
 * Extract the first complete top-level JSON object from the string.
 * Uses brace depth tracking and properly handles strings.
 */
function extractFirstJsonObject(content: string): string | null {
  const startIdx = content.indexOf('{');
  if (startIdx === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startIdx; i < content.length; i++) {
    const char = content[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          return content.slice(startIdx, i + 1);
        }
      }
    }
  }

  // No complete object found
  return null;
}

async function tryChat(
  client: LLMClient,
  messages: LLMChatMessage[],
  provider: LLMProviderName,
  retry: boolean,
): Promise<{ summary?: string } | null> {
  const isGeminiNative = provider === 'gemini';

  // Keep responseFormat json_object for ALL attempts
  const payload: LLMRequest = {
    messages,
    model: isGeminiNative ? config.geminiModel : undefined,
    responseFormat: 'json_object',
    maxTokens: 350,
    temperature: 0,
  };

  if (retry) {
    // Append strict instruction on retry
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
  const content = response.content;

  logger.debug({ content, retry }, 'Profile Update Raw Response');

  // Extract JSON using balanced extractor
  const extracted = extractBalancedJson(content);

  if (!extracted) {
    if (!retry) {
      logger.warn('Profile Update: No JSON object found. Retrying...');
      return tryChat(client, messages, provider, true);
    }
    // After retry fails, try repair pass
    return tryRepairPass(client, content);
  }

  // Validate JSON
  try {
    const json = JSON.parse(extracted);
    return json;
  } catch (e) {
    logger.debug({ error: e, extracted }, 'JSON Parse Error in profile update');
    if (!retry) {
      // RETRY ONCE
      logger.warn('Profile Update: Invalid JSON received. Retrying with stronger prompt...');
      return tryChat(client, messages, provider, true);
    }

    // After retry fails, try repair pass
    return tryRepairPass(client, content);
  }
}

/**
 * Repair pass: Ask the LLM to convert raw output to valid JSON.
 * This is a last-ditch effort when normal parsing fails.
 */
async function tryRepairPass(
  client: LLMClient,
  rawContent: string,
): Promise<{ summary?: string } | null> {
  logger.warn('Profile Update: Attempting repair pass...');

  const repairSystemPrompt =
    'Convert the following to JSON exactly: {"summary":"..."}. Output JSON only, nothing else.';

  const payload: LLMRequest = {
    messages: [
      { role: 'system', content: repairSystemPrompt },
      { role: 'user', content: rawContent },
    ],
    responseFormat: 'json_object',
    temperature: 0,
    maxTokens: 200,
  };

  try {
    const response = await client.chat(payload);
    const extracted = extractBalancedJson(response.content);

    if (!extracted) {
      logger.error({ content: response.content }, 'Profile Update: Repair pass failed - no JSON');
      return null;
    }

    const json = JSON.parse(extracted);
    logger.info('Profile Update: Repair pass succeeded');
    return json;
  } catch (error) {
    logger.error({ error, rawContent }, 'Profile Update: Repair pass failed');
    return null;
  }
}
