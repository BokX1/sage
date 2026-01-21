import { StyleProfile } from './styleClassifier';

export interface ComposeSystemPromptParams {
  /** User profile summary for personalization */
  userProfileSummary: string | null;
  /** Detected style profile to mirror or adapt to */
  style?: StyleProfile;
}

/**
 * Compose the system prompt using the "Context-First" architecture.
 *
 * Structure:
 * 1. Base Identity (Kernel)
 * 2. User Context (Memory)
 * 3. Interaction Mode (Style)
 * 4. Priority Instructions (Hierarchy enforcement)
 */
export function composeSystemPrompt(params: ComposeSystemPromptParams): string {
  const { userProfileSummary, style } = params;

  // 1. Base Identity (Kernel)
  const baseIdentity = `You are Sage, an autonomous, context-aware Discord agent.
You remember conversations, track relationships, and generate personalized responses.`;

  // 2. User Context (Memory)
  // This is the most critical section. It MUST exist if we have data.
  const memorySection = userProfileSummary
    ? `## User Context\n${userProfileSummary}`
    : `## User Context\n(No specific user data available yet)`;

  // 3. Interaction Mode (Style)
  // Dynamic style injection based on heurstics, but capable of being overridden by memory.
  let styleInstructions = 'Response style: Concise, helpful, and friendly.';

  if (style) {
    const { verbosity, formality, humor, directness } = style;
    styleInstructions = `Response style:
- Verbosity: ${verbosity}
- Formality: ${formality}
- Humor: ${humor}
- Directness: ${directness}`;
  }

  const modeSection = `## Current Interaction Mode\n${styleInstructions}`;

  // 4. Priority Instructions (Hierarchy Enforcement)
  const prioritySection = `## Priority Instruction
**Interaction Mode adapts to the immediate conversation, but NEVER violate User Context preferences.**`;

  // Combine into a single coherent system prompt
  return [baseIdentity, memorySection, modeSection, prioritySection].join('\n\n');
}

/**
 * Legacy compatibility helper - irrelevant in new architecture but kept to prevent breakages if referenced elsewhere.
 */
export function getCorePromptContent(): string {
  return composeSystemPrompt({ userProfileSummary: null });
}
