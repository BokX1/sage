import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Mock Logger
vi.mock('../../src/utils/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        child: () => ({
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        }),
    },
}));

// 2. Mock Prisma
// We define mock logic in the factory to ensure it's available.
// We can't access outer variables easily because of hoisting.
// So we use local variables inside the factory and we'll access them via import in tests?
// No, the best way for fully isolated mocks is to import the module and spy on it.
// OR assume the module exports 'prisma' object which has methods we can mock.

vi.mock('../../src/db/client', () => ({
    prisma: {
        userProfile: {
            findUnique: vi.fn(),
            upsert: vi.fn(),
        },
    },
}));

// 3. Mock LLM
// We mock getLLMClient to return an object with a mocked chat function.
const mockChatFn = vi.fn();
vi.mock('../../src/core/llm', () => ({
    getLLMClient: () => ({
        chat: mockChatFn,
    }),
}));

import { generateChatReply } from '../../src/core/chat/chatEngine';
import { prisma } from '../../src/db/client';

describe('ChatEngine', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockChatFn.mockReset();
    });

    it('should generate a reply using the LLM', async () => {
        // Mock profile lookup (no profile)
        vi.mocked(prisma.userProfile.findUnique).mockResolvedValueOnce(null);
        // Mock LLM chat response
        mockChatFn.mockResolvedValue({ content: 'Hello there!' });

        const result = await generateChatReply({
            traceId: 'test-trace',
            userId: 'user1',
            channelId: 'chan1',
            messageId: 'msg1',
            userText: 'Hi',
        });

        expect(result.replyText).toBe('Hello there!');
        // Should have called LLM with system and user msg
        expect(mockChatFn).toHaveBeenCalledTimes(2); // Once for reply, once for profile update
        const chatCall = mockChatFn.mock.calls[0][0]; // First call
        expect(chatCall.messages[1].content).toBe('Hi');
    });

    it('should inject personal memory into system prompt', async () => {
        // Mock profile with summary
        vi.mocked(prisma.userProfile.findUnique).mockResolvedValueOnce({
            userId: 'user1',
            summary: 'Likes cats',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        mockChatFn.mockResolvedValue({ content: 'Meow' });

        await generateChatReply({
            traceId: 'test-trace',
            userId: 'user1',
            channelId: 'chan1',
            messageId: 'msg1',
            userText: 'Do I like pets?',
        });

        const chatCall = mockChatFn.mock.calls[0][0];
        // Index 0 is main system prompt, Index 1 is memory (if present)
        const memoryMsg = chatCall.messages[1].content;
        expect(memoryMsg).toContain('Likes cats');
    });

    it('should trigger profile update in background', async () => {
        // Mock profile
        vi.mocked(prisma.userProfile.findUnique).mockResolvedValueOnce({
            userId: 'user1',
            summary: 'Old summary',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Mock LLM calls:
        // 1. Reply generation
        mockChatFn.mockResolvedValueOnce({ content: 'Sure, updated.' });
        // 2. Profile update generation (MUST BE JSON)
        mockChatFn.mockResolvedValueOnce({
            content: JSON.stringify({ summary: 'New stable preference: likes dark mode' })
        });

        await generateChatReply({
            traceId: 'test-trace',
            userId: 'user1',
            channelId: 'chan1',
            messageId: 'msg1',
            userText: 'I like dark mode now',
        });

        // Wait a tick for fire-and-forget promise
        await new Promise(resolve => setTimeout(resolve, 10));

        // Check if updating LLM was called
        expect(mockChatFn).toHaveBeenCalledTimes(2);

        expect(prisma.userProfile.upsert).toHaveBeenCalled();
        expect(prisma.userProfile.upsert).toHaveBeenCalledWith(expect.objectContaining({
            where: { userId: 'user1' },
            update: { summary: 'New stable preference: likes dark mode' }
        }));
    });
});
