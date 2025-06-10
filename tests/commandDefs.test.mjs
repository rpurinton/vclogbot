import fs from 'fs';
import path from 'path';

describe('Command definitions (.json) are valid and follow Discord command schema', () => {
  const commandsDir = path.join(process.cwd(), 'src', 'commands');
  const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.json'));
  const localeKeys = [
    "bg", "cs", "da", "de", "el", "en-GB", "en-US", "es-419", "es-ES", "fi", "fr", "hi", "hr", "hu", "id", "it", "ja", "ko", "lt", "nl", "no", "pl", "pt-BR", "ro", "ru", "sv-SE", "th", "tr", "uk", "vi", "zh-CN", "zh-TW"
  ];
  const chatInputRegex = /^[-_'\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u;
  if (files.length === 0) {
    test('dummy test - no command definition files present', () => {
      expect(true).toBe(true);
    });
  }
  for (const file of files) {
    const filePath = path.join(commandsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    let parsed;
    test(`${file} parses as JSON`, () => {
      expect(() => { parsed = JSON.parse(content); }).not.toThrow(`Failed to parse JSON in ${file}`);
    });
    parsed = JSON.parse(content);
    test(`${file} has valid name and type`, () => {
      expect(typeof parsed.name).toBe('string');
      expect(typeof parsed.type).toBe('number');
    });
    if (parsed.type === 1) {
      test(`${file} (CHAT_INPUT) has valid description, name, and localizations`, () => {
        expect(typeof parsed.description).toBe('string');
        expect(chatInputRegex.test(parsed.name)).toBe(true);
        for (const ch of parsed.name) {
          if (ch.toLowerCase && ch.toUpperCase && ch.toLowerCase() !== ch.toUpperCase()) {
            expect(ch).toBe(ch.toLowerCase());
          }
        }
        expect(parsed.name_localizations).toBeDefined();
        for (const key of localeKeys) {
          expect(parsed.name_localizations[key]).toBeDefined();
          expect(typeof parsed.name_localizations[key]).toBe('string');
          expect(chatInputRegex.test(parsed.name_localizations[key])).toBe(true);
          for (const ch of parsed.name_localizations[key]) {
            if (ch.toLowerCase && ch.toUpperCase && ch.toLowerCase() !== ch.toUpperCase()) {
              expect(ch).toBe(ch.toLowerCase());
            }
          }
        }
        expect(parsed.description_localizations).toBeDefined();
        for (const key of localeKeys) {
          expect(parsed.description_localizations[key]).toBeDefined();
          expect(typeof parsed.description_localizations[key]).toBe('string');
        }
      });
      if (parsed.options) {
        for (const [i, opt] of parsed.options.entries()) {
          test(`${file} option[${i}] has valid name and localizations`, () => {
            expect(opt.name_localizations).toBeDefined();
            expect(opt.description_localizations).toBeDefined();
            expect(chatInputRegex.test(opt.name)).toBe(true);
            for (const ch of opt.name) {
              if (ch.toLowerCase && ch.toUpperCase && ch.toLowerCase() !== ch.toUpperCase()) {
                expect(ch).toBe(ch.toLowerCase());
              }
            }
            for (const key of localeKeys) {
              expect(opt.name_localizations[key]).toBeDefined();
              expect(typeof opt.name_localizations[key]).toBe('string');
              expect(chatInputRegex.test(opt.name_localizations[key])).toBe(true);
              for (const ch of opt.name_localizations[key]) {
                if (ch.toLowerCase && ch.toUpperCase && ch.toLowerCase() !== ch.toUpperCase()) {
                  expect(ch).toBe(ch.toLowerCase());
                }
              }
              expect(opt.description_localizations[key]).toBeDefined();
              expect(typeof opt.description_localizations[key]).toBe('string');
            }
          });
        }
      }
    } else if (parsed.type > 1) {
      test(`${file} (USER/MESSAGE) has valid name and no description`, () => {
        expect(typeof parsed.name).toBe('string');
        expect(parsed.name.length).toBeGreaterThanOrEqual(1);
        expect(parsed.name.length).toBeLessThanOrEqual(32);
        expect(parsed.name_localizations).toBeDefined();
        for (const key of localeKeys) {
          expect(parsed.name_localizations[key]).toBeDefined();
          expect(typeof parsed.name_localizations[key]).toBe('string');
          expect(parsed.name_localizations[key].length).toBeGreaterThanOrEqual(1);
          expect(parsed.name_localizations[key].length).toBeLessThanOrEqual(32);
        }
        if (parsed.options) {
          for (const [i, opt] of parsed.options.entries()) {
            expect(typeof opt.name).toBe('string');
            expect(opt.name.length).toBeGreaterThanOrEqual(1);
            expect(opt.name.length).toBeLessThanOrEqual(32);
            expect(opt.name_localizations).toBeDefined();
            for (const key of localeKeys) {
              expect(opt.name_localizations[key]).toBeDefined();
              expect(typeof opt.name_localizations[key]).toBe('string');
              expect(opt.name_localizations[key].length).toBeGreaterThanOrEqual(1);
              expect(opt.name_localizations[key].length).toBeLessThanOrEqual(32);
            }
          }
        }
        expect(parsed.description).toBeUndefined();
        expect(parsed.description_localizations).toBeUndefined();
      });
    }
  }
});
