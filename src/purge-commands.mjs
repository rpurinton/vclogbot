import 'dotenv/config';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';
import log from './log.mjs';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.PURGE_GUILD_ID || null;

if (!token || !clientId) {
    log.error('DISCORD_TOKEN and DISCORD_CLIENT_ID must be set in your environment.');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        // Purge all global application commands
        await rest.put(Routes.applicationCommands(clientId), { body: [] });
        log.info('All global application commands purged.');

        if (guildId) {
            // Purge all guild-specific application commands
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
            log.info(`All application commands purged for guild ${guildId}.`);
        }
    } catch (error) {
        log.error('Failed to purge application commands:', error);
        process.exit(1);
    }
})();
