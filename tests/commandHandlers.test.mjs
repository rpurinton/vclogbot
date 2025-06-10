import fs from 'fs';
import path from 'path';

describe('All command handler files export a default function', () => {
  const commandsDir = path.join(process.cwd(), 'src', 'commands');
  const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.mjs'));
  if (files.length === 0) {
    test('dummy test - no command handler files present', () => {
      expect(true).toBe(true);
    });
  }
  for (const file of files) {
    const filePath = path.join(commandsDir, file);
    test(`${file} exports a default function`, async () => {
      const mod = await import(filePath);
      expect(typeof mod.default).toBe('function');
    });
  }
});
