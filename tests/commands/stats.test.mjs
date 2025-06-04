import { jest } from '@jest/globals';
import createStatsHandler from '../../src/commands/stats.mjs';

describe('/stats command handler', () => {
    let mockLog, mockDb, mockFormatTime, mockRequiredSecondsForLevel, mockGetMsg, handler, interaction;
    const now = new Date('2025-06-04T12:00:00Z');
    const nowEpoch = Math.floor(now.getTime() / 1000);

    beforeEach(() => {
        mockLog = { error: jest.fn() };
        mockDb = { query: jest.fn() };
        mockFormatTime = jest.fn((s) => `${s}s`);
        mockRequiredSecondsForLevel = jest.fn((lvl) => lvl * 100);
        mockGetMsg = jest.fn((locale, key, fallback) => fallback);
        jest.useFakeTimers().setSystemTime(now);
        interaction = {
            user: { id: 'user1' },
            guildId: 'guild1',
            locale: 'en-US',
            options: { getUser: jest.fn() },
            reply: jest.fn().mockResolvedValue()
        };
        handler = createStatsHandler({
            log: mockLog,
            db: mockDb,
            formatTime: mockFormatTime,
            requiredSecondsForLevel: mockRequiredSecondsForLevel,
            getMsg: mockGetMsg
        });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('replies with not found if user has no stats', async () => {
        mockDb.query.mockResolvedValueOnce([[]]);
        await handler(interaction);
        expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('No stats found'),
            flags: expect.any(Number)
        }));
    });

    it('replies with stats for user not in call', async () => {
        mockDb.query
            .mockResolvedValueOnce([[{ total_seconds: 150, last_level: 1 }]]) // user stats
            .mockResolvedValueOnce([[]]) // not in call
            .mockResolvedValueOnce([[{ leave_time: now.toISOString() }]]); // last seen
        await handler(interaction);
        expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('voice stats:'),
            flags: expect.any(Number)
        }));
        expect(mockFormatTime).toHaveBeenCalledWith(150);
        expect(mockRequiredSecondsForLevel).toHaveBeenCalledWith(2);
    });

    it('replies with stats for user in call', async () => {
        mockDb.query
            .mockResolvedValueOnce([[{ total_seconds: 200, last_level: 2 }]]) // user stats
            .mockResolvedValueOnce([[{ join_time: now.toISOString() }]]); // in call
        await handler(interaction);
        expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('voice stats:'),
            flags: expect.any(Number)
        }));
    });

    it('handles error and replies with error message', async () => {
        mockDb.query.mockRejectedValueOnce(new Error('fail'));
        await handler(interaction);
        expect(mockLog.error).toHaveBeenCalledWith('Error in /stats handler', expect.any(Error));
        expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('Error fetching stats.'),
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
