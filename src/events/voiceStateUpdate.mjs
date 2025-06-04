import db from '../db.mjs';
import log from '../log.mjs';
import { getCurrentTimestamp } from '../custom/utils.mjs';
import { timerFunction } from '../custom/timer.mjs';

// Event handler for voiceStateUpdate
export default async function (oldState, newState) {
    log.debug(`VoiceStateUpdate: oldState=${JSON.stringify(oldState)}, newState=${JSON.stringify(newState)}`);
    try {
        // User leaves a voice channel
        if (oldState.channelId && !newState.channelId) {
            try {
                // Check for existing open session
                const [openSessionRows] = await db.query(
                    `SELECT * FROM sessions WHERE user_id = ? AND guild_id = ? AND leave_time IS NULL`,
                    [oldState.id, oldState.guild?.id]
                );
                const openSession = openSessionRows[0];
                if (openSession) {
                    // Await timerFunction to update user records
                    await timerFunction();
                    // Set leave_time for the session
                    const now = new Date();
                    const mysqlDatetime = now.toISOString().slice(0, 19).replace('T', ' ');
                    await db.query(
                        `UPDATE sessions SET leave_time = ? WHERE id = ?`,
                        [mysqlDatetime, openSession.id]
                    );
                    if (global.messageService) {
                        const msg = `${getCurrentTimestamp()} <@${oldState.id}> left!`;
                        await global.messageService.sendMessage(oldState.channelId, msg);
                    }
                }
            } catch (err) {
                log.error('Error handling voice leave event', err);
            }
        } else if (newState.channelId) {
            // Any event where the user is in a channel (join, mute/unmute, etc)
            try {
                // Check for existing open session
                const [openSessionRows] = await db.query(
                    `SELECT * FROM sessions WHERE user_id = ? AND guild_id = ? AND leave_time IS NULL`,
                    [newState.id, newState.guild?.id]
                );
                const openSession = openSessionRows[0];
                if (!openSession) {
                    // Insert new session (late join or missed join event)
                    const now = new Date();
                    const mysqlDatetime = now.toISOString().slice(0, 19).replace('T', ' ');
                    await db.query(
                        `INSERT INTO sessions (user_id, guild_id, channel_id, join_time) VALUES (?, ?, ?, ?)`,
                        [newState.id, newState.guild?.id, newState.channelId, mysqlDatetime]
                    );
                    if (global.messageService) {
                        const msg = `${getCurrentTimestamp()} <@${newState.id}> joined!`;
                        await global.messageService.sendMessage(newState.channelId, msg);
                    }
                }
            } catch (err) {
                log.error('Error handling voice session start event', err);
            }
        }
        // else: do nothing if not in a channel
    } catch (error) {
        log.error('Error in voiceStateUpdate event handler', error);
    }
}
