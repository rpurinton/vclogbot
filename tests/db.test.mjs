import { jest } from '@jest/globals';
import { createDb } from '../src/db.mjs';

describe('createDb', () => {
  it('creates a pool with injected mysqlLib and env', async () => {
    const fakePool = { fake: true };
    const mockMysql = { createPool: jest.fn(() => fakePool) };
    const env = {
      DB_HOST: 'host',
      DB_USER: 'user',
      DB_PASS: 'pass',
      DB_NAME: 'name',
    };
    const db = await createDb({ env, mysqlLib: mockMysql });
    expect(db).toBe(fakePool);
    expect(mockMysql.createPool).toHaveBeenCalledWith(expect.objectContaining({
      host: 'host',
      user: 'user',
      password: 'pass',
      database: 'name',
    }));
  });

  it('throws if env vars are missing', async () => {
    await expect(createDb({ env: {} })).rejects.toThrow(/Database environment variables/);
  });

  it('logs and throws if createPool throws', async () => {
    const mockMysql = { createPool: jest.fn(() => { throw new Error('fail'); }) };
    const env = {
      DB_HOST: 'host',
      DB_USER: 'user',
      DB_PASS: 'pass',
      DB_NAME: 'name',
    };
    const logger = { error: jest.fn() };
    await expect(createDb({ env, mysqlLib: mockMysql, logger })).rejects.toThrow('fail');
    expect(logger.error).toHaveBeenCalledWith('Failed to create MySQL connection pool', expect.any(Error));
  });
});
