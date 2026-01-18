import { Events, Interaction } from 'discord.js';
import { client } from '../client';
import { logger } from '../../utils/logger';
import { getLLMClient } from '../../core/llm';
import { config } from '../../core/config/env';

const registrationKey = Symbol.for('sage.handlers.interactionCreate.registered');

export function registerInteractionCreateHandler() {
  const g = globalThis as any;
  if (g[registrationKey]) {
    return;
  }
  g[registrationKey] = true;

  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    try {
      if (!interaction.isChatInputCommand()) return;

      if (interaction.commandName === 'ping') {
        await interaction.reply('Pong!');
      }

      if (interaction.commandName === 'llm_ping') {
        await interaction.deferReply({ ephemeral: true });
        const start = Date.now();

        try {
          const llm = getLLMClient();
          const response = await llm.chat({
            messages: [{ role: 'user', content: 'Say OK' }],
            maxTokens: 5,
            temperature: 0.1,
          });
          const duration = Date.now() - start;
          await interaction.editReply(
            `✅ **LLM Connection Established!**\n` +
              `**Response**: "${response.content.trim()}"\n` +
              `**Latency**: ${duration}ms\n` +
              `**Latency**: ${duration}ms\n` +
              `**Provider**: ${config.llmProvider}`,
          );
        } catch (e: any) {
          await interaction.editReply(
            `❌ **LLM Connection Failed**.\n` +
              `**Error**: ${e.message}\n` +
              `**Status**: Check server logs for details.`,
          );
        }
      }
    } catch (err) {
      logger.error({ err }, 'Interaction handler error');
      if (interaction.isRepliable()) {
        const reply = { content: 'Something went wrong.', ephemeral: true };
        if (interaction.deferred) await interaction.editReply(reply);
        else await interaction.reply(reply);
      }
    }
  });

  logger.info(
    { count: client.listenerCount(Events.InteractionCreate) },
    'InteractionCreate handler registered',
  );
}
