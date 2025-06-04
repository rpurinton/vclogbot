import 'dotenv/config';
import log from '../log.mjs';
import db from '../db.mjs';
import { requiredSecondsForLevel } from './utils.mjs';

export async function main({ db: injectedDb, log: injectedLog, requiredSecondsForLevel: injectedRequiredSecondsForLevel } = {}) {
    const dbToUse = injectedDb || db;
    const logToUse = injectedLog || log;
    const requiredSeconds = injectedRequiredSecondsForLevel || requiredSecondsForLevel;
    const [users] = await dbToUse.query(
        'SELECT DISTINCT user_id, guild_id FROM sessions'
    );

    for (const { user_id, guild_id } of users) {
        const [rows] = await dbToUse.query(
            `SELECT SUM(
               IFNULL(UNIX_TIMESTAMP(leave_time), UNIX_TIMESTAMP()) - UNIX_TIMESTAMP(join_time)
            ) AS total_seconds
            FROM sessions WHERE user_id = ? AND guild_id = ? AND join_time IS NOT NULL`,
            [user_id, guild_id]
        );
        const total_seconds = Math.max(0, rows[0].total_seconds || 0);
        let level = 0;
        while (total_seconds >= requiredSeconds(level + 1)) {
            level++;
        }
        await dbToUse.query(
            `INSERT INTO users (user_id, guild_id, total_seconds, last_level) VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE total_seconds=?, last_level=?`,
            [user_id, guild_id, total_seconds, level, total_seconds, level]
        );
        logToUse.info(`Updated user ${user_id} in guild ${guild_id}: total_seconds=${total_seconds}, level=${level}`);
    }
    logToUse.info('Sanity check complete.');
    // Close DB connection if not injected
    if (!injectedDb && dbToUse && typeof dbToUse.end === 'function') {
        await dbToUse.end();
    }
}

if (process.argv[1] && process.argv[1].endsWith('dbSanityCheck.mjs')) {
    main().catch(e => {
        log.error('Error running sanity check:', e);
        process.exit(1);
    });
}
