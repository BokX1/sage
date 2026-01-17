import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { config } from '../../core/config/env';
import { logger } from '../../utils/logger';

const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
    new SlashCommandBuilder()
        .setName('llm_ping')
        .setDescription('Admin: Test LLM connectivity (Config Verification)'),
].map(command => command.toJSON());

export async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(config.discordToken);

    try {
        logger.info('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(config.discordAppId), { body: commands });

        logger.info('Successfully reloaded application (/) commands.');
    } catch (error) {
        logger.error(error);
    }
}



