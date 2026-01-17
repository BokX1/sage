import { client } from './bot/client';
import { config } from './core/config/env';
import { logger } from './utils/logger';
import { registerCommands } from './bot/commands';
import { registerMessageCreateHandler } from './bot/handlers/messageCreate';
import { registerInteractionCreateHandler } from './bot/handlers/interactionCreate';

async function main() {
    if (!config.discordToken) {
        logger.error('DISCORD_TOKEN is missing');
        process.exit(1);
    }

    // Register handlers (idempotent)
    registerMessageCreateHandler();
    registerInteractionCreateHandler();

    client.once('ready', async () => {
        logger.info(`Logged in as ${client.user?.tag}! (Sage v0.2 Chat Only - Ready)`);
        await registerCommands();
    });

    await client.login(config.discordToken);
}

main().catch((err) => {
    logger.error(err);
    process.exit(1);
});
