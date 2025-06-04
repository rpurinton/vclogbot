import { jest } from '@jest/globals';
import createLeaderboardHandler from '../../src/commands/leaderboard.mjs';

describe('/leaderboard command handler', () => {
    let mockLog, mockDb, mockFormatTime, mockGetMsg, handler, interaction;

    beforeEach(() => {
        mockLog = { error: jest.fn() };
        mockDb = { query: jest.fn() };
        mockFormatTime = jest.fn((s) => `${s}s`);
        mockGetMsg = jest.fn((locale, key, fallback) => fallback);
        interaction = {
            guildId: 'guild1',
            locale: 'en-US',
            reply: jest.fn().mockResolvedValue()
        };
        handler = createLeaderboardHandler({
            log: mockLog,
            db: mockDb,
            formatTime: mockFormatTime,
            getMsg: mockGetMsg
        });
    });

    it('replies with not found if no leaderboard data', async () => {
        mockDb.query.mockResolvedValueOnce([[]]);
        await handler(interaction);
        expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('No leaderboard data found'),
            flags: expect.any(Number)
        }));
    });

    it('replies with leaderboard data', async () => {
        mockDb.query.mockResolvedValueOnce([
            [
                { user_id: 'user1', total_seconds: 100, last_level: 2 },
                { user_id: 'user2', total_seconds: 80, last_level: 1 }
            ]
        ]);
        await handler(interaction);
        expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('Top 10 Voice Leaderboard'),
            flags: expect.any(Number)
        }));
        expect(mockFormatTime).toHaveBeenCalledWith(100);
        expect(mockFormatTime).toHaveBeenCalledWith(80);
    });

    it('handles error and replies with error message', async () => {
        mockDb.query.mockRejectedValueOnce(new Error('fail'));
        await handler(interaction);
        expect(mockLog.error).toHaveBeenCalledWith('Error in /leaderboard handler', expect.any(Error));
        expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('Error fetching leaderboard.'),
            flags: expect.any(Number)
        }));
    });

    it('logs error if reply with error message fails', async () => {
        mockDb.query.mockRejectedValueOnce(new Error('fail'));
        interaction.reply.mockRejectedValueOnce(new Error('fail2'));
        await handler(interaction);
        expect(mockLog.error).toHaveBeenCalledWith('Failed to reply with error message', expect.any(Error));
    });
});
