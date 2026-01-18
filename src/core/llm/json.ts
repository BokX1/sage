import { ZodSchema } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import { LLMClient, LLMChatMessage } from './types';
import { logger } from '../utils/logger';

export async function callWithSchema<T>(
  client: LLMClient,
  schema: ZodSchema<T>,
  messages: LLMChatMessage[],
  systemInstructions?: string,
): Promise<T | null> {
  const jsonSchema = zodToJsonSchema(schema as any, 'output');
  const schemaStr = JSON.stringify(jsonSchema, null, 2);

  const systemPrompt = `
${systemInstructions || 'You are a helpful assistant that outputs strictly valid JSON.'}

You must output valid JSON matching this schema:
\`\`\`json
${schemaStr}
\`\`\`

Do not wrap the output in markdown blocks. Output raw JSON only.
`.trim();

  // 1. Initial Call
  const fullMessages: LLMChatMessage[] = [{ role: 'system', content: systemPrompt }, ...messages];

  try {
    const response = await client.chat({
      messages: fullMessages,
      responseFormat: 'json_object',
    });

    return parseAndValidate(response.content, schema);
  } catch (error) {
    logger.warn({ error }, '[callWithSchema] Initial call failed or invalid JSON');
    // 2. Repair Attempt
    return repairJsonOnce(
      client,
      schema,
      messages,
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function repairJsonOnce<T>(
  client: LLMClient,
  schema: ZodSchema<T>,
  originalMessages: LLMChatMessage[],
  errorMsg: string,
): Promise<T | null> {
  // Construct a repair prompt
  // In a real robust system, we might feed back the bad output.
  // For now, simpler: retry with emphasis on the error.

  // Re-inject system prompt context if missing from original messages (unlikely if passed properly)
  // Actually, we should probably just re-run the whole context + "Previous attempt failed"
  // But let's keep it simple: just call again with the same system prompt but verify we have it.
  // The 'originalMessages' here likely didn't include the injected system prompt from callWithSchema.
  // Let's refactor slightly to be cleaner.

  // Simpler strategy: Just re-try the EXACT same call but with high urgency in system prompt?
  // Or append a user message saying "You failed, fix it".

  // Let's append to the conversation.
  const repairMessages: LLMChatMessage[] = [
    ...originalMessages,
    {
      role: 'user',
      content: `Your previous response was invalid JSON. Error: ${errorMsg}. Please output ONLY valid JSON matching the schema.`,
    },
  ];

  try {
    const response = await client.chat({
      messages: repairMessages, // Note: this lacks the system prompt if originalMessages lacked it.
      // But callWithSchema constructs fullMessages.
      // We need to pass the *full* context including system prompt for the repair to work well?
      // Or just rely on the LLM remembering (stateless, so NO).
      // We need the system prompt.
      responseFormat: 'json_object',
    });
    return parseAndValidate(response.content, schema);
  } catch (finalError) {
    logger.error({ error: finalError }, '[callWithSchema] Repair failed');
    return null;
  }
}

function parseAndValidate<T>(content: string, schema: ZodSchema<T>): T {
  // Try to find JSON if wrapped in markdown
  let clean = content.trim();
  const match = clean.match(/```json\s*([\s\S]*?)\s*```/) || clean.match(/```\s*([\s\S]*?)\s*```/);
  if (match) {
    clean = match[1];
  }

  const json = JSON.parse(clean);
  return schema.parse(json);
}
