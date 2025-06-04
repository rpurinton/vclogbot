import log from '../log.mjs';
import db from '../db.mjs';
import { formatTime } from '../custom/utils.mjs';
import { getMsg } from '../locales.mjs';

// Command handler for /leaderboard
export default async function (interaction) {
    try {
        const guildId = interaction.guildId;
        const [rows] = await db.query(
            'SELECT user_id, total_seconds, last_level FROM users WHERE guild_id = ? ORDER BY total_seconds DESC LIMIT 10',
            [guildId]
        );
        if (!rows || rows.length === 0) {
            await interaction.reply({
                content: getMsg(interaction.locale, 'leaderboard_not_found', 'No leaderboard data found.'),
                flags: 1 << 6,
            });
            return;
        }
        let leaderboard = rows.map((row, i) => `#${i+1} <@${row.user_id}>: **${formatTime(row.total_seconds)}** (Lvl ${row.last_level})`).join('\n');
        await interaction.reply({
            content: getMsg(interaction.locale, 'leaderboard_reply', `Top 10 Voice Leaderboard:\n${leaderboard}`).replace('{leaderboard}', leaderboard),
            flags: 1 << 6,
        });
    } catch (err) {
        log.error('Error in /leaderboard handler', err);
        try {
            await interaction.reply({
                content: getMsg(interaction.locale, 'leaderboard_error', 'Error fetching leaderboard.'),
                flags: 1 << 6,
            });
        } catch (e) {
            log.error('Failed to reply with error message', e);
        }
    }
}
