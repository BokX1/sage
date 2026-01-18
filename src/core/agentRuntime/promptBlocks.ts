import { estimateTokens } from './tokenEstimate';

/**
 * PromptBlock - a composable unit for building system prompts.
 * Enables stable, deterministic prompt ordering.
 */
export interface PromptBlock {
  /** Optional unique ID for deterministic tie-breaking */
  id?: string;
  /** Section title (used for ordering and as section header) */
  title: string;
  /** Section content */
  content: string;
  /** Priority for ordering (higher = earlier). Default: 0 */
  priority?: number;
  /** If true, this block is never dropped during budgeting (e.g. safety/truthfulness) */
  essential?: boolean;
}

/**
 * Filter blocks to fit within the token budget.
 * Drops non-essential blocks with lowest priority first.
 */
export function budgetSystemPrompt(blocks: PromptBlock[], maxTokens: number): PromptBlock[] {
  // 1. Calculate total usage
  // +4 tokens per block for section header overhead/formatting safety margin
  let currentTokens = blocks.reduce((sum, b) => sum + estimateTokens(b.content) + 4, 0);

  if (currentTokens <= maxTokens) {
    return blocks;
  }

  // 2. Identify droppable blocks (non-essential)
  // Sort by priority ASC (lowest priority first), then by title/id
  const droppable = blocks
    .filter((b) => !b.essential)
    .sort((a, b) => {
      const pA = a.priority ?? 0;
      const pB = b.priority ?? 0;
      if (pA !== pB) return pA - pB;
      // Tie-break: title then id to be deterministic
      const tA = a.title || a.id || '';
      const tB = b.title || b.id || '';
      return tA.localeCompare(tB);
    });

  // 3. Drop blocks until fit or no more droppable
  // We identify blocks to remove by instance or ID.
  const droppedIndices = new Set<number>();

  for (const block of droppable) {
    if (currentTokens <= maxTokens) break;

    const cost = estimateTokens(block.content) + 4;
    currentTokens -= cost;

    // Find original index to mark as dropped (handling duplicate contents approx)
    // We use object reference matching here since `droppable` contains refs from `blocks`
    const originalIndex = blocks.indexOf(block);
    if (originalIndex !== -1) {
      droppedIndices.add(originalIndex);
    }
  }

  return blocks.filter((_, idx) => !droppedIndices.has(idx));
}

/**
 * Render prompt blocks into a single system prompt string.
 * Ordering: higher priority first, then alphabetical by title/id for stability.
 */
export function renderPromptBlocks(blocks: PromptBlock[]): string {
  if (blocks.length === 0) return '';

  // Sort by priority desc, then title asc for determinism
  const sorted = [...blocks].sort((a, b) => {
    const priorityA = a.priority ?? 0;
    const priorityB = b.priority ?? 0;
    if (priorityB !== priorityA) return priorityB - priorityA;

    // Deterministic tie-breaker
    const titleA = a.title || '';
    const titleB = b.title || '';
    const cmp = titleA.localeCompare(titleB);
    if (cmp !== 0) return cmp;

    const idA = a.id || '';
    const idB = b.id || '';
    return idA.localeCompare(idB);
  });

  // Render with section separators
  return sorted
    .map((block) => {
      // Single block with no title = just content
      if (sorted.length === 1 && !block.title.trim()) {
        return block.content.trim();
      }
      // Named section with separator
      if (block.title.trim()) {
        return `## ${block.title}\n${block.content.trim()}`;
      }
      return block.content.trim();
    })
    .filter(Boolean)
    .join('\n\n');
}
