import log from '../log.mjs';
import { timerFunction } from '../custom/timer.mjs';

// Event handler for ready
export default async function (client) {
    log.info(`Logged in as ${client.user.tag}`);
    client.user.setPresence({ activities: [{ name: 'VC Leveling', type: 4 }], status: 'online' });
    await timerFunction();
    setInterval(async () => {
        try {
            await timerFunction();
        } catch (error) {
            log.error('Error in timerFunction:', error);
        }
    }, 60000); // Run every minute
}
