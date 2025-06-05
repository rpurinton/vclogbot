import log from './log.mjs';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getCurrentFilename } from './esm-filename.mjs';

export const locales = {};

export const loadLocales = ({
    fsLib = { readdirSync, readFileSync },
    pathLib = { join, dirname },
    fileURLToPathFn = fileURLToPath,
    logger = log,
    meta = import.meta,
    localesDir: customLocalesDir
} = {}) => {
    try {
        const __filename = getCurrentFilename(meta);
        const __dirname = pathLib.dirname(__filename);
        const localesDir = customLocalesDir || pathLib.join(__dirname, 'locales');
        let files;
        try {
            files = fsLib.readdirSync(localesDir).filter(f => f.endsWith('.json'));
        } catch (err) {
            logger.error(`Failed to read locales directory: ${localesDir}`, err);
            return;
        }
        for (const file of files) {
            try {
                const content = fsLib.readFileSync(pathLib.join(localesDir, file), 'utf8');
                locales[file.replace(/\.json$/, '')] = JSON.parse(content);
            } catch (err) {
                logger.error(`Failed to load or parse locale file ${file}:`, err);
            }
        }
    } catch (err) {
        logger.error('Unexpected error in loadLocales:', err);
    }
};

export const clearLocales = () => {
    Object.keys(locales).forEach(key => delete locales[key]);
};

export const getMsg = (locale, key, defaultValue = 'An error occurred :(', logger = log) => {
    if (!locales[locale]) {
        logger.warn(`Locale "${locale}" not found, falling back to default.`);
        locale = 'en-US';
    }
    if (!locales[locale]) {
        logger.error(`Default locale "en-US" not found. Returning default value.`);
        return defaultValue;
    }
    const msg = locales[locale][key];
    if (msg === undefined) {
        logger.warn(`Key "${key}" not found in locale "${locale}", returning default value.`);
        return defaultValue;
    }
    return msg;
};