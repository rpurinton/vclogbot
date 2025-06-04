import 'dotenv/config';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';
import log from './log.mjs';

/**
 * Purges all global and (optionally) guild-specific application commands.
 * @param {Object} options
 * @param {string} options.token - Discord bot token
 * @param {string} options.clientId - Discord client ID
 * @param {string|null} [options.guildId] - Guild ID to purge (optional)
 * @param {Object} [options.restClass=REST] - REST class
 * @param {Object} [options.routes=Routes] - Discord.js Routes
 * @param {Object} [options.logger=log] - Logger instance
 * @returns {Promise<void>}
 */
export async function purgeCommands({
    token,
    clientId,
    guildId = null,
    restClass = REST,
    routes = Routes,
    logger = log
}) {
    if (!token || !clientId) {
        logger.error('DISCORD_TOKEN and DISCORD_CLIENT_ID must be set in your environment.');
        throw new Error('Missing credentials');
    }
    const rest = new restClass({ version: '10' }).setToken(token);
    // Purge all global application commands
    await rest.put(routes.applicationCommands(clientId), { body: [] });
    logger.info('All global application commands purged.');
    if (guildId) {
        await rest.put(routes.applicationGuildCommands(clientId, guildId), { body: [] });
        logger.info(`All application commands purged for guild ${guildId}.`);
    }
}

// CLI usage
if (import.meta.url === process.argv[1] || import.meta.url === `file://${process.argv[1]}`) {
    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.DISCORD_CLIENT_ID;
    const guildId = process.env.PURGE_GUILD_ID || null;
    purgeCommands({ token, clientId, guildId }).catch(err => {
        process.exit(1);
    });
}
