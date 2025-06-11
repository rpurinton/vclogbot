import { jest } from '@jest/globals';
import { createLogger } from '../src/log.mjs';
import winston from 'winston';
import { Writable } from 'stream';

describe('log.mjs', () => {
  it('creates a logger with default level', () => {
    const logger = createLogger();
    expect(logger).toBeInstanceOf(winston.Logger);
    expect(logger.level).toBe(process.env.LOG_LEVEL || 'info');
  });

  it('creates a logger with custom level', () => {
    const logger = createLogger({ level: 'debug' });
    expect(logger.level).toBe('debug');
  });

  it('logs messages in expected format', () => {
    const logs = [];
    const writable = new Writable({
      write(chunk, encoding, callback) {
        logs.push(chunk.toString().trim());
        callback();
      }
    });
    const transport = new winston.transports.Stream({ stream: writable });
    const logger = createLogger({ transports: [transport], level: 'info' });
    logger.info('test message');
    expect(logs[0]).toMatch(/\[INFO\] test message/);
  });

  it('includes meta in log output', () => {
    const logs = [];
    const writable = new Writable({
      write(chunk, encoding, callback) {
        logs.push(chunk.toString().trim());
        callback();
      }
    });
    const transport = new winston.transports.Stream({ stream: writable });
    const logger = createLogger({ transports: [transport], level: 'info' });
    logger.info('msg', { foo: 'bar' });
    expect(logs[0]).toMatch(/\{"foo":"bar"\}/);
  });
});
