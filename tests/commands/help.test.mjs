import { jest } from '@jest/globals';
import createHelpHandler from '../../src/commands/help.mjs';

describe('/help command handler', () => {
    let mockLog, mockGetMsg, handler, interaction;

    beforeEach(() => {
        mockLog = { error: jest.fn() };
        mockGetMsg = jest.fn((locale, key, fallback) => fallback);
        interaction = {
            locale: 'en-US',
            reply: jest.fn().mockResolvedValue()
        };
        handler = createHelpHandler({
            log: mockLog,
            getMsg: mockGetMsg
        });
    });

    it('replies with help content', async () => {
        mockGetMsg.mockReturnValueOnce('Help content here.');
        await handler(interaction);
        expect(interaction.reply).toHaveBeenCalledWith({
            content: 'Help content here.',
            flags: 1 << 6
        });
    });

    it('handles error and replies with error message', async () => {
        mockGetMsg.mockImplementation(() => { throw new Error('fail'); });
        await handler(interaction);
        expect(mockLog.error).toHaveBeenCalledWith('Error in /help handler', expect.any(Error));
        expect(interaction.reply).toHaveBeenCalledWith({
            content: 'An error occurred while processing your request.',
            flags: 1 << 6
        });
    });

    it('logs error if reply with error message fails', async () => {
        mockGetMsg.mockImplementation(() => { throw new Error('fail'); });
        interaction.reply.mockRejectedValueOnce(new Error('fail2'));
        await handler(interaction);
        expect(mockLog.error).toHaveBeenCalledWith('Failed to reply with error message', expect.any(Error));
    });
});
