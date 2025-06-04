import log from '../log.mjs';
import { getMsg } from '../locales.mjs';

// Command handler for /help with dependency injection
export default function createHelpHandler({ log: injectedLog = log, getMsg: injectedGetMsg = getMsg } = {}) {
    return async function (interaction) {
        try {
            const helpContent = injectedGetMsg(interaction.locale, "help", "No help available for this command.");
            await interaction.reply({
                content: helpContent,
                flags: 1 << 6, // EPHEMERAL
            });
        } catch (err) {
            injectedLog.error("Error in /help handler", err);
            try {
                await interaction.reply({
                    content: "An error occurred while processing your request.",
                    flags: 1 << 6,
                });
            } catch (e) {
                injectedLog.error("Failed to reply with error message", e);
            }
        }
    };
}
