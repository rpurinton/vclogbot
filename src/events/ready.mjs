import log from '../log.mjs';
import { timerFunction } from '../custom/timer.mjs';

// Event handler for ready with dependency injection
export default function createReadyHandler({ log: injectedLog = log, timerFunction: injectedTimerFunction = timerFunction } = {}) {
    return async function (client) {
        injectedLog.info(`Logged in as ${client.user.tag}`);
        client.user.setPresence({ activities: [{ name: '🎧 VC Leveling', type: 4 }], status: 'online' });
        try {
            await injectedTimerFunction();
        } catch (error) {
            injectedLog.error('Error in timerFunction:', error);
        }
        setInterval(async () => {
            try {
                await injectedTimerFunction();
            } catch (error) {
                injectedLog.error('Error in timerFunction:', error);
            }
        }, 60000); // Run every minute
    };
}
