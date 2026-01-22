import { Client, GatewayIntentBits } from 'discord.js';

/**
 * Configure the shared Discord client instance and required intents.
 *
 * Responsibilities:
 * - Define gateway intents required by message, interaction, and voice features.
 *
 * Non-goals:
 * - Manage login or lifecycle of the client.
 */
/**
 * Provide the singleton Discord client used by the bot.
 *
 * @returns The configured Discord.js Client instance.
 *
 * Side effects:
 * - Allocates the client with gateway intents.
 *
 * Error behavior:
 * - Does not throw.
 *
 * Invariants:
 * - Intents include message, guild, and voice features required by handlers.
 */
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});
