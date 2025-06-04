import log from '../log.mjs';
import { getMsg } from '../locales.mjs';

// Command handler for /help
export default async function (interaction) {
    try {
        const helpContent = getMsg(interaction.locale, "help", "No help available for this command.");
        await interaction.reply({
            content: helpContent,
            flags: 1 << 6, // EPHEMERAL
        });
    } catch (err) {
        log.error("Error in /help handler", err);
        try {
            await interaction.reply({
                content: "An error occurred while processing your request.",
                flags: 1 << 6,
            });
        } catch (e) {
            log.error("Failed to reply with error message", e);
        }
    }
}
