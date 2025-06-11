import 'dotenv/config';
import log from './log.mjs';

/**
 * Creates and returns a MySQL connection pool, allowing dependency injection for testability.
 * @param {Object} [options]
 * @param {Object} [options.env] - Environment variables (default: process.env)
 * @param {Object} [options.mysqlLib] - mysql2/promise module (default: dynamic import)
 * @param {Object} [options.logger] - Logger instance (default: log)
 * @returns {Object|Promise<Object>} MySQL pool instance
 */
export async function createDb({ env = process.env, mysqlLib, logger = log } = {}) {
    if (!env.DB_HOST || !env.DB_USER || !env.DB_PASS || !env.DB_NAME) {
        throw new Error('Database environment variables are not set. Please check your .env file.');
    }
    let db;
    try {
        let mysqlModule = mysqlLib;
        if (!mysqlModule) {
            mysqlModule = (await import('mysql2/promise'));
        }
        db = mysqlModule.createPool({
            host: env.DB_HOST,
            user: env.DB_USER,
            password: env.DB_PASS,
            database: env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    } catch (err) {
        logger.error('Failed to create MySQL connection pool', err);
        throw err;
    }
    return db;
}

// Default export for production usage
let dbPromise;
if (!dbPromise) {
    dbPromise = createDb();
}
export default dbPromise;
