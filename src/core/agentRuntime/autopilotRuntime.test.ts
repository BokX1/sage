import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runChatTurn } from './agentRuntime';
import { getLLMClient } from '../llm';
import { config } from '../config/env';

// Mock dependencies
vi.mock('../llm');
vi.mock('../awareness/channelRingBuffer');
vi.mock('../awareness/transcriptBuilder');
vi.mock('../settings/guildChannelSettings', () => ({
    isLoggingEnabled: vi.fn().mockReturnValue(false),
}));
vi.mock('../utils/logger');
vi.mock('../orchestration/router', () => ({
    decideRoute: vi.fn().mockReturnValue({ kind: 'simple', temperature: 0.7, experts: [] }),
}));
vi.mock('../orchestration/runExperts', () => ({
    runExperts: vi.fn().mockResolvedValue([]),
}));
vi.mock('../orchestration/governor', () => ({
    governOutput: vi.fn().mockImplementation(async ({ draftText }) => ({
        finalText: draftText,
        actions: [],
    })),
}));
vi.mock('../trace/agentTraceRepo');

describe('Autopilot Runtime', () => {
    const mockLLM = {
        chat: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (getLLMClient as any).mockReturnValue(mockLLM);
    });

    it('should return empty string when LLM outputs [SILENCE]', async () => {
        mockLLM.chat.mockResolvedValue({ content: '[SILENCE]' });

        const result = await runChatTurn({
            traceId: 'test-trace',
            userId: 'test-user',
            channelId: 'test-channel',
            guildId: 'test-guild',
            messageId: 'msg-1',
            userText: 'Hello',
            userProfileSummary: null,
            replyToBotText: null,
            intent: 'autopilot',
            invokedBy: 'autopilot',
        });

        expect(result.replyText).toBe('');
        expect(mockLLM.chat).toHaveBeenCalled();
    });

    it('should return text when LLM outputs normal text', async () => {
        mockLLM.chat.mockResolvedValue({ content: 'Hello there!' });

        const result = await runChatTurn({
            traceId: 'test-trace',
            userId: 'test-user',
            channelId: 'test-channel',
            guildId: 'test-guild',
            messageId: 'msg-1',
            userText: 'Hello',
            userProfileSummary: null,
            replyToBotText: null,
            intent: 'autopilot',
            invokedBy: 'autopilot',
        });

        expect(result.replyText).toBe('Hello there!');
    });

    it('should treat whitespace with [SILENCE] as silence', async () => {
        mockLLM.chat.mockResolvedValue({ content: '  [SILENCE]  \n ' });

        const result = await runChatTurn({
            traceId: 'test-trace',
            userId: 'test-user',
            channelId: 'test-channel',
            guildId: 'test-guild',
            messageId: 'msg-1',
            userText: 'Hello',
            userProfileSummary: null,
            replyToBotText: null,
            intent: 'autopilot',
            invokedBy: 'autopilot',
        });

        expect(result.replyText).toBe('');
    });
});
