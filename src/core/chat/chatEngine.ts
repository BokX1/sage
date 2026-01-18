import { getLLMClient } from '../llm';
import { config } from '../config/env';
import { getUserProfile, upsertUserProfile } from '../memory/userProfileRepo';
import { updateProfileSummary } from '../memory/profileUpdater';
import { logger } from '../utils/logger';
import { LLMChatMessage } from '../llm/types';

const SYSTEM_PROMPT = `You are Sage, a helpful personalized Discord chatbot.
- Be concise, practical, and friendly.
- Ask a clarifying question when needed.
- If the user requests up-to-date facts, answer with current information if available.
- Never describe your internal process. Never mention searching, browsing, tools, function calls, or how you obtained information.
- Do not say things like “I searched”, “I looked up”, “I found online”, “I can’t browse”, or any equivalent.
- When it improves trust, include a short “References:” section with 1–5 links or source names. Do not say you searched for them; just list them.`;

// OPENAI/POLLINATIONS-COMPATIBLE TOOL DEFINITION
const GOOGLE_SEARCH_TOOL = {
  type: 'function',
  function: {
    name: 'google_search',
    description:
      'Search the web for real-time information. Use this whenever the user asks for current facts, news, or topics you do not know.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query string.',
        },
      },
      required: ['query'],
    },
  },
};

export async function generateChatReply(params: {
  traceId: string;
  userId: string;
  channelId: string;
  messageId: string;
  userText: string;
  replyToBotText?: string | null;
}): Promise<{ replyText: string }> {
  const { userId, userText, replyToBotText } = params;

  // 1. Load Profile
  const profileSummary = await getUserProfile(userId);

  logger.debug({ userId, profileSummary: profileSummary || 'None' }, 'Memory Context');

  // 2. Build Messages
  const messages: LLMChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];

  if (profileSummary) {
    messages.push({
      role: 'system',
      content: `Personalization memory (may be incomplete): ${profileSummary}`,
    });
  }

  if (replyToBotText) {
    messages.push({ role: 'assistant', content: replyToBotText });
  }

  messages.push({ role: 'user', content: userText });

  // 3. Call LLM
  const client = getLLMClient();
  let replyText = '';

  logger.debug({ messages }, 'Outgoing Prompts');

  try {
    // Internal search enabled, strictly auto
    const isGeminiNative = config.llmProvider === 'gemini';
    const isPollinations = config.llmProvider === 'pollinations';

    const tools = [];
    if (isGeminiNative) {
      tools.push({ googleSearch: {} });
    } else if (isPollinations) {
      // Pollinations needs standard OpenAI tool format.
      // Our client shim will detect this + json mode and handle the prompt injection.
      tools.push(GOOGLE_SEARCH_TOOL);
    }

    const response = await client.chat({
      messages,
      // If native, use config.geminiModel. If Pollinations, let client fallback to default (active model)
      model: isGeminiNative ? config.geminiModel : undefined,
      // Only attach native tool syntax if native
      tools: tools.length > 0 ? tools : undefined,
      toolChoice: isGeminiNative || isPollinations ? 'auto' : undefined,
      temperature: 0.7,
    });
    replyText = response.content;
  } catch (err) {
    logger.error({ error: err }, 'LLM Chat Error');
    return { replyText: "I'm having trouble connecting right now. Please try again later." };
  }

  // 4. Output Guardrail
  const BANNED_PHRASES = [
    'google search',
    'internet search',
    'i searched',
    'i found online',
    'browsing',
    'tool',
    'function call',
    'search result',
    'i looked up',
    'querying',
    'searching',
    'according to my search',
    'my internal tools',
  ];

  const lowerReply = replyText.toLowerCase();
  const hasBanned = BANNED_PHRASES.some((phrase) => lowerReply.includes(phrase));

  if (hasBanned) {
    const isGeminiNative = config.llmProvider === 'gemini';
    try {
      const rewriteResponse = await client.chat({
        messages: [
          {
            role: 'system',
            content:
              'Rewrite the response to remove any mention of searching/browsing/tools/process. Keep meaning. Keep References if present.',
          },
          { role: 'user', content: replyText },
        ],
        model: isGeminiNative ? config.geminiModel : undefined,
        temperature: 0,
      });
      replyText = rewriteResponse.content;
    } catch (e) {
      logger.error({ error: e }, 'Guardrail rewrite failed');
    }
  }

  // 5. Update Profile (Background)
  updateProfileSummary({
    previousSummary: profileSummary,
    userMessage: userText,
    assistantReply: replyText,
  }).then((newSummary) => {
    if (newSummary && newSummary !== profileSummary) {
      upsertUserProfile(userId, newSummary).catch((err) =>
        logger.error({ error: err }, 'Failed to save profile'),
      );
    }
  });

  return { replyText };
}
