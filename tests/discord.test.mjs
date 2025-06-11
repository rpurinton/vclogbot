import { jest } from '@jest/globals';
import { createAndLoginDiscordClient } from '../src/discord.mjs';

describe('createAndLoginDiscordClient', () => {
  let oldToken;
  beforeAll(() => {
    oldToken = process.env.DISCORD_TOKEN;
  });
  afterAll(() => {
    process.env.DISCORD_TOKEN = oldToken;
  });

  it('throws if no token is provided', async () => {
    delete process.env.DISCORD_TOKEN;
    await expect(createAndLoginDiscordClient({ token: undefined })).rejects.toThrow(/Discord token is not set/);
  });

  it('creates client, sets up events, and logs in', async () => {
    const login = jest.fn(() => Promise.resolve('logged-in'));
    const setupEventsFn = jest.fn(async (client) => { client._eventsSetup = true; });
    const ClientClass = jest.fn().mockImplementation(() => ({ login, _eventsSetup: false }));
    const logger = { error: jest.fn() };
    const client = await createAndLoginDiscordClient({
      token: 'abc',
      logger,
      setupEventsFn,
      ClientClass,
      GatewayIntentBitsObj: { Guilds: 1, GuildMessages: 2, MessageContent: 3, GuildMembers: 4, GuildPresences: 5, GuildVoiceStates: 6 },
      partials: ['MESSAGE'],
      clientOptions: { foo: 'bar' }
    });
    const callArgs = ClientClass.mock.calls[0][0];
    expect(callArgs.foo).toBe('bar');
    expect(callArgs.partials).toEqual(['MESSAGE']);
    expect(callArgs.intents).toEqual(expect.arrayContaining([1, 2]));
    expect(setupEventsFn).toHaveBeenCalledWith(expect.any(Object));
    expect(login).toHaveBeenCalledWith('abc');
    expect(client._eventsSetup).toBe(true);
  });

  it('logs and throws if login fails', async () => {
    const login = jest.fn(() => Promise.reject(new Error('fail')));
    const setupEventsFn = jest.fn(async () => {});
    const ClientClass = jest.fn().mockImplementation(() => ({ login }));
    const logger = { error: jest.fn() };
    await expect(createAndLoginDiscordClient({
      token: 'abc',
      logger,
      setupEventsFn,
      ClientClass,
      GatewayIntentBitsObj: { Guilds: 1, GuildMessages: 2, MessageContent: 3, GuildMembers: 4, GuildPresences: 5, GuildVoiceStates: 6 },
      partials: ['MESSAGE'],
      clientOptions: { foo: 'bar' }
    })).rejects.toThrow('fail');
    expect(logger.error).toHaveBeenCalledWith('Failed to login:', expect.any(Error));
  });
});
