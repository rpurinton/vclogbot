import log from '../log.mjs';
import db from '../db.mjs';
import { formatTime } from '../custom/utils.mjs';
import { requiredSecondsForLevel } from '../custom/utils.mjs';
import { getMsg } from '../locales.mjs';

// Command handler for /stats with dependency injection
export default function createStatsHandler({ log: injectedLog = log, db: injectedDb = db, formatTime: injectedFormatTime = formatTime, requiredSecondsForLevel: injectedRequiredSecondsForLevel = requiredSecondsForLevel, getMsg: injectedGetMsg = getMsg } = {}) {
    return async function (interaction) {
        try {
            const userOption = interaction.options.getUser && interaction.options.getUser('user');
            const userToQuery = userOption || interaction.user;
            const guildId = interaction.guildId;
            const [rows] = await injectedDb.query(
                'SELECT total_seconds, last_level FROM users WHERE user_id = ? AND guild_id = ?',
                [userToQuery.id, guildId]
            );
            if (!rows || rows.length === 0) {
                await interaction.reply({
                    content: injectedGetMsg(interaction.locale, 'stats_not_found', `No stats found for ${userToQuery.id === interaction.user.id ? 'you' : `<@${userToQuery.id}>`}.`).replace('{user}', userToQuery.id === interaction.user.id ? 'you' : `<@${userToQuery.id}>`),
                    flags: 1 << 6,
                });
                return;
            }
            const { total_seconds, last_level } = rows[0];
            const now = Math.floor(Date.now() / 1000);
            const nextLevel = last_level + 1;
            const required = injectedRequiredSecondsForLevel(nextLevel);
            const remaining = Math.max(0, required - total_seconds);
            // Check if user is currently in a call (open session)
            const [sessionRows] = await injectedDb.query(
                'SELECT join_time FROM sessions WHERE user_id = ? AND guild_id = ? AND leave_time IS NULL ORDER BY join_time DESC LIMIT 1',
                [userToQuery.id, guildId]
            );
            let inCall = false;
            let lastSeenMsg = '';
            let nextLevelMsg;
            let lastSeenTimestamp = null;
            if (sessionRows && sessionRows.length > 0) {
                // User is in a call
                inCall = true;
                const nextLevelTimestamp = now + remaining;
                nextLevelMsg = injectedGetMsg(interaction.locale, 'stats_next_level', `\n- Time until next level (**${nextLevel}**): <t:${nextLevelTimestamp}:R>`)
                    .replace('{level}', nextLevel)
                    .replace('{timestamp}', nextLevelTimestamp);
            } else {
                // User is NOT in a call
                // Show static time remaining
                if (remaining > 0) {
                    const hours = Math.floor(remaining / 3600);
                    const minutes = Math.floor((remaining % 3600) / 60);
                    let timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                    nextLevelMsg = injectedGetMsg(interaction.locale, 'stats_next_level_static', `\n- Time until next level (**${nextLevel}**): **${timeStr}**`)
                        .replace('{level}', nextLevel)
                        .replace('{time}', timeStr);
                } else {
                    nextLevelMsg = injectedGetMsg(interaction.locale, 'stats_max_level', '\n- You have reached the max level!');
                }
                // Find last time user left a call
                const [lastSessionRows] = await injectedDb.query(
                    'SELECT leave_time FROM sessions WHERE user_id = ? AND guild_id = ? AND leave_time IS NOT NULL ORDER BY leave_time DESC LIMIT 1',
                    [userToQuery.id, guildId]
                );
                if (lastSessionRows && lastSessionRows.length > 0 && lastSessionRows[0].leave_time) {
                    lastSeenTimestamp = Math.floor(new Date(lastSessionRows[0].leave_time).getTime() / 1000);
                    lastSeenMsg = injectedGetMsg(interaction.locale, 'stats_last_seen', '\n- Last seen in voice: <t:{lastseen}:R>')
                        .replace('{lastseen}', lastSeenTimestamp);
                }
            }
            await interaction.reply({
                content: injectedGetMsg(
                    interaction.locale,
                    'stats_reply',
                    `${userToQuery.id === interaction.user.id ? 'Your' : `<@${userToQuery.id}>'s`} voice stats:\n- Total time: **${injectedFormatTime(total_seconds)}**\n- Level: **${last_level}**${nextLevelMsg}`
                )
                    .replace('{user}', userToQuery.id === interaction.user.id ? 'Your' : `<@${userToQuery.id}>'s`)
                    .replace('{time}', injectedFormatTime(total_seconds))
                    .replace('{level}', last_level)
                    .replace('{next}', nextLevelMsg)
                + (lastSeenMsg || ''),
                flags: 1 << 6,
            });
        } catch (err) {
            injectedLog.error('Error in /stats handler', err);
            try {
                await interaction.reply({
                    content: injectedGetMsg(interaction.locale, 'stats_error', 'Error fetching stats.'),
                    flags: 1 << 6,
                });
            } catch (e) {
                injectedLog.error('Failed to reply with error message', e);
            }
        }
    };
}
