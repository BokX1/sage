import { VoiceManager } from '../../core/voice/voiceManager';
import { logger } from '../../utils/logger';
import { getLLMClient } from '../../core/llm';
import { Readable } from 'stream';
import { config } from '../../core/config/env';
import { getGuildApiKey } from '../../core/settings/guildSettingsRepo';

export function registerVoiceEventHandlers() {
  const voiceManager = VoiceManager.getInstance();

  voiceManager.on('audio_input', async ({ guildId, userId, audioBuffer }) => {
    logger.info({ guildId, userId, size: audioBuffer.length }, 'Received audio input');

    // 1. Resolve API Key (BYOP: Guild Key > Global Key)
    const guildKey = await getGuildApiKey(guildId);
    const effectiveKey = guildKey || config.pollinationsApiKey;

    if (!effectiveKey) {
      logger.warn(
        { guildId, userId },
        'Missing API Key (Global or Guild). Voice chat requires a paid plan or valid key for the openai-audio model. Use /sage key set to configure.',
      );
      // Optional: Send a voice message explaining this? For now, silence/log is safer to avoid loops.
      return;
    }

    try {
      const llm = getLLMClient();
      
      // Convert buffer to base64
      const base64Audio = audioBuffer.toString('base64');

      // Send to LLM
      logger.info({ guildId, userId, usingGuildKey: !!guildKey }, 'Sending audio to LLM...');
      const response = await llm.chat({
        model: 'openai-audio', // Enforce audio model
        apiKey: effectiveKey,  // Pass the resolved key
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Please reply to this audio.' }, 
              {
                type: 'input_audio',
                input_audio: {
                  data: base64Audio,
                  format: 'wav', 
                },
              },
            ],
          },
        ],
      });

      logger.info({ guildId, userId, responseContent: response.content }, 'Received LLM response');

      // Handle Audio Response
      if (response.audio) {
        logger.info({ guildId, userId }, 'Playing back audio response...');
        const audioData = Buffer.from(response.audio.data, 'base64');
        const stream = Readable.from(audioData);
        await voiceManager.playAudio(guildId, stream);
      } else if (response.content) {
        // Fallback: If no audio, maybe TTS? Or just log it.
        logger.info({ guildId, userId, text: response.content }, 'LLM replied with text only');
      }

    } catch (error) {
      logger.error({ error, guildId, userId }, 'Error processing voice input');
    }
  });
}
