/**
 * Define the JSON envelope for provider-agnostic tool calls.
 *
 * Details: tools are requested by name with JSON arguments; the runtime validates
 * and executes them before continuing the conversation.
 *
 * Side effects: none.
 * Error behavior: none.
 */
export interface ToolCallEnvelope {
  type: 'tool_calls';
  calls: Array<{
    name: string;
    args: Record<string, unknown>;
  }>;
}

/**
 * Provide the retry prompt for invalid tool-call JSON.
 *
 * Details: instructs the LLM to return only a tool envelope or a plain text
 * answer when tools are not needed.
 *
 * Side effects: none.
 * Error behavior: none.
 */
export const RETRY_PROMPT = `Your previous response was not valid JSON. Output ONLY valid JSON matching the exact schema:
{
  "type": "tool_calls",
  "calls": [{ "name": "<tool_name>", "args": { ... } }]
}
OR respond with a plain text answer if you don't need to use tools.`;

/**
 * Strip markdown code fences from an LLM response.
 *
 * Details: unwraps ``` or ```json blocks so JSON parsing can proceed.
 *
 * Side effects: none.
 * Error behavior: none.
 */
function stripCodeFences(text: string): string {
  const fencePattern = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/;
  const match = text.trim().match(fencePattern);
  return match ? match[1].trim() : text.trim();
}

/**
 * Check whether text plausibly contains JSON.
 *
 * Details: used to decide whether to trigger a deterministic retry prompt.
 *
 * Side effects: none.
 * Error behavior: none.
 */
export function looksLikeJson(text: string): boolean {
  const trimmed = text.trim();
  return (
    (trimmed.startsWith('{') || trimmed.startsWith('[')) &&
    (trimmed.includes('"type"') || trimmed.includes('"name"') || trimmed.includes('"calls"'))
  );
}

/**
 * Parse a tool call envelope from an LLM response.
 *
 * Details: validates the expected shape before returning the parsed envelope.
 *
 * Side effects: none.
 * Error behavior: returns null on parse or validation failure.
 */
export function parseToolCallEnvelope(text: string): ToolCallEnvelope | null {
  try {
    const stripped = stripCodeFences(text);
    const parsed = JSON.parse(stripped);

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      parsed.type === 'tool_calls' &&
      Array.isArray(parsed.calls)
    ) {
      const validCalls = parsed.calls.every(
        (c: unknown) =>
          typeof c === 'object' &&
          c !== null &&
          typeof (c as { name?: unknown }).name === 'string' &&
          typeof (c as { args?: unknown }).args === 'object',
      );
      if (validCalls) {
        return parsed as ToolCallEnvelope;
      }
    }
    return null;
  } catch {
    return null;
  }
}
