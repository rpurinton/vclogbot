import { jest } from '@jest/globals';
import createReadyHandler from '../../src/events/ready.mjs';

// Mock objects
function createMockClient() {
    return {
        user: {
            tag: 'TestUser#1234',
            setPresence: jest.fn(),
        },
    };
}

describe('ready event handler', () => {
    let mockLog, mockTimerFunction, handler, client;

    beforeEach(() => {
        mockLog = {
            info: jest.fn(),
            error: jest.fn(),
        };
        mockTimerFunction = jest.fn().mockResolvedValue();
        handler = createReadyHandler({ log: mockLog, timerFunction: mockTimerFunction });
        client = createMockClient();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('logs in and sets presence', async () => {
        await handler(client);
        expect(mockLog.info).toHaveBeenCalledWith('Logged in as TestUser#1234');
        expect(client.user.setPresence).toHaveBeenCalledWith({ activities: [{ name: '🎧 VC Leveling', type: 4 }], status: 'online' });
    });

    it('calls timerFunction immediately and on interval', async () => {
        await handler(client);
        expect(mockTimerFunction).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(60000);
        // Wait for the interval callback to run
        await Promise.resolve();
        expect(mockTimerFunction).toHaveBeenCalledTimes(2);
    });

    it('logs error if timerFunction throws', async () => {
        mockTimerFunction.mockRejectedValueOnce(new Error('fail'));
        await handler(client);
        // The error should be logged from the initial call
        expect(mockLog.error).toHaveBeenCalledWith('Error in timerFunction:', expect.any(Error));
        // Now advance the timer and ensure no additional error log (since next call resolves)
        jest.advanceTimersByTime(60000);
        await Promise.resolve();
        expect(mockLog.error).toHaveBeenCalledTimes(1);
    });
});