import { client } from './bot/client';
import { config } from './config';
import { logger } from './utils/logger';

import { registerMessageCreateHandler } from './bot/handlers/messageCreate';
import { registerInteractionCreateHandler } from './bot/handlers/interactionCreate';
import { registerVoiceStateUpdateHandler } from './bot/handlers/voiceStateUpdate';
import { initChannelSummaryScheduler } from './core/summary/channelSummaryScheduler';

import { registerReadyHandler } from './bot/handlers/ready';

async function main() {
  if (!config.DISCORD_TOKEN) {
    logger.error('DISCORD_TOKEN is missing');
    process.exit(1);
  }

  // Register handlers (idempotent)
  registerMessageCreateHandler();
  registerInteractionCreateHandler();
  registerVoiceStateUpdateHandler(); // D1: Voice event ingestion
  registerReadyHandler(client); // D1: Startup backfill & logging
  initChannelSummaryScheduler();

  await client.login(config.DISCORD_TOKEN);
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
