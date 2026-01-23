import { VoiceManager } from '../../core/voice/voiceManager';
import { logger } from '../../utils/logger';
import { getLLMClient } from '../../core/llm';
import { Readable } from 'stream';
import { config } from '../../core/config/env';

export function registerVoiceEventHandlers() {
  const voiceManager = VoiceManager.getInstance();

  voiceManager.on('audio_input', async ({ guildId, userId, audioBuffer }) => {
    logger.info({ guildId, userId, size: audioBuffer.length }, 'Received audio input');

    if (!config.pollinationsApiKey) {
      logger.warn(
        { guildId, userId },
        'Missing POLLINATIONS_API_KEY. Voice chat requires a paid plan or valid key for the openai-audio model.',
      );
      return;
    }

    try {
      const llm = getLLMClient();
      
      // Convert buffer to base64
      const base64Audio = audioBuffer.toString('base64');

      // Send to LLM
      logger.info({ guildId, userId }, 'Sending audio to LLM...');
      const response = await llm.chat({
        model: 'openai-audio', // Enforce audio model
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Please reply to this audio.' }, // Optional text prompt
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
        // For now, if we don't get audio back, we just log the text.
        logger.info({ guildId, userId, text: response.content }, 'LLM replied with text only');
      }

    } catch (error) {
      logger.error({ error, guildId, userId }, 'Error processing voice input');
    }
  });
}
