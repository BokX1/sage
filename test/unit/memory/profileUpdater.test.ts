import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateProfileSummary, extractBalancedJson } from '../../../src/core/memory/profileUpdater';

// Mock LLM Client
const mockChatFn = vi.fn();
vi.mock('../../../src/core/llm', () => ({
  getLLMClient: () => ({
    chat: mockChatFn,
  }),
  createLLMClient: () => ({
    chat: mockChatFn,
  }),
}));

// Mock Config
vi.mock('../../../src/core/config/env', () => ({
  config: {
    llmProvider: 'pollinations',
    profileProvider: '',
    profilePollinationsModel: '',
  },
}));

describe('ProfileUpdater', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChatFn.mockReset();
  });

  describe('updateProfileSummary', () => {
    it('should retry when receiving invalid JSON ("Meow") - keeping json_object format', async () => {
      // 1. First call fails with text (JSON mode mismatch/hallucination)
      mockChatFn.mockResolvedValueOnce({
        content: 'Meow',
      });

      // 2. Second call (retry) succeeds with valid JSON
      mockChatFn.mockResolvedValueOnce({
        content: '{"summary": "Likes cats"}',
      });

      const result = await updateProfileSummary({
        previousSummary: null,
        userMessage: 'I love cats',
        assistantReply: 'Meow',
      });

      expect(result).toBe('Likes cats');
      expect(mockChatFn).toHaveBeenCalledTimes(2);

      // Verify first call asked for JSON object
      expect(mockChatFn.mock.calls[0][0].responseFormat).toEqual('json_object');

      // Verify second call (retry) ALSO uses json_object (key change from old behavior)
      const retryCall = mockChatFn.mock.calls[1][0];
      expect(retryCall.responseFormat).toEqual('json_object');

      // Verify strict instruction was appended
      const lastMsg = retryCall.messages[retryCall.messages.length - 1];
      expect(lastMsg.content).toContain('IMPORTANT: Output ONLY valid JSON');
    });

    it('should parse JSON in code blocks', async () => {
      mockChatFn.mockResolvedValueOnce({
        content: 'Here you go:\n```json\n{"summary": "Likes cats"}\n```',
      });

      const result = await updateProfileSummary({
        previousSummary: null,
        userMessage: 'I love cats',
        assistantReply: 'Cats are great!',
      });

      expect(result).toBe('Likes cats');
      expect(mockChatFn).toHaveBeenCalledTimes(1);
    });

    it('should handle braces inside JSON strings correctly', async () => {
      mockChatFn.mockResolvedValueOnce({
        content: 'Note: {"summary": "User said {hello} and likes {braces}"}',
      });

      const result = await updateProfileSummary({
        previousSummary: null,
        userMessage: 'I said {hello}',
        assistantReply: 'Hello!',
      });

      expect(result).toBe('User said {hello} and likes {braces}');
      expect(mockChatFn).toHaveBeenCalledTimes(1);
    });

    it('should use repair pass when normal parsing fails twice', async () => {
      // 1. First call fails with plain text
      mockChatFn.mockResolvedValueOnce({
        content: 'Meow',
      });

      // 2. Second call (retry) also fails
      mockChatFn.mockResolvedValueOnce({
        content: 'Woof',
      });

      // 3. Third call (repair pass) succeeds
      mockChatFn.mockResolvedValueOnce({
        content: '{"summary": "Likes animals"}',
      });

      const result = await updateProfileSummary({
        previousSummary: null,
        userMessage: 'I like animals',
        assistantReply: 'Animals are great!',
      });

      expect(result).toBe('Likes animals');
      expect(mockChatFn).toHaveBeenCalledTimes(3);

      // Verify repair pass call
      const repairCall = mockChatFn.mock.calls[2][0];
      expect(repairCall.responseFormat).toEqual('json_object');
      expect(repairCall.messages[0].content).toContain('Convert the following to JSON');
    });

    it('should return null if all attempts fail including repair pass', async () => {
      mockChatFn.mockResolvedValue({ content: 'Meow again' });

      const result = await updateProfileSummary({
        previousSummary: null,
        userMessage: 'Hi',
        assistantReply: 'Hi',
      });

      expect(result).toBeNull();
      // Initial + retry + repair = 3 calls
      expect(mockChatFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('extractBalancedJson', () => {
    it('should extract JSON from code blocks', () => {
      const input = 'Here you go:\n```json\n{"summary": "Likes cats"}\n```';
      const result = extractBalancedJson(input);
      expect(result).toBe('{"summary": "Likes cats"}');
    });

    it('should extract JSON from code blocks without json marker', () => {
      const input = 'Result:\n```\n{"summary": "test"}\n```';
      const result = extractBalancedJson(input);
      expect(result).toBe('{"summary": "test"}');
    });

    it('should extract first object when text surrounds JSON', () => {
      const input = 'Here is the result: {"summary": "test"} hope that helps!';
      const result = extractBalancedJson(input);
      expect(result).toBe('{"summary": "test"}');
    });

    it('should correctly handle braces inside strings', () => {
      const input = '{"summary": "User said {hello} and {world}"}';
      const result = extractBalancedJson(input);
      expect(result).toBe('{"summary": "User said {hello} and {world}"}');
    });

    it('should handle escaped quotes in strings', () => {
      const input = '{"summary": "User said \\"hello\\" friend"}';
      const result = extractBalancedJson(input);
      expect(result).toBe('{"summary": "User said \\"hello\\" friend"}');
    });

    it('should handle nested objects', () => {
      const input = 'prefix {"outer": {"inner": "value"}} suffix';
      const result = extractBalancedJson(input);
      expect(result).toBe('{"outer": {"inner": "value"}}');
    });

    it('should return null for no JSON', () => {
      const input = 'This is just plain text with no JSON';
      const result = extractBalancedJson(input);
      expect(result).toBeNull();
    });

    it('should return null for incomplete JSON', () => {
      const input = 'Incomplete: {"summary": "test"';
      const result = extractBalancedJson(input);
      expect(result).toBeNull();
    });
  });
});
