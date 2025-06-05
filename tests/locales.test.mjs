import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';
import { locales, loadLocales, clearLocales, getMsg } from '../src/locales.mjs';

describe('locales.mjs', () => {
  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  const mockFs = {
    readdirSync: jest.fn(),
    readFileSync: jest.fn()
  };
  const mockPath = {
    join: path.join,
    dirname: path.dirname
  };
  const testDir = path.join(process.cwd(), 'tests', 'mock-locales');
  const enJson = '{"help":"Help text"}';
  const esJson = '{"help":"Texto de ayuda"}';

  beforeAll(() => {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);
    fs.writeFileSync(path.join(testDir, 'en-US.json'), enJson);
    fs.writeFileSync(path.join(testDir, 'es-ES.json'), esJson);
  });
  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });
  afterEach(() => {
    clearLocales();
    jest.clearAllMocks();
  });

  it('loads locales from directory', () => {
    mockFs.readdirSync.mockReturnValue(['en-US.json', 'es-ES.json']);
    mockFs.readFileSync.mockImplementation((file) => {
      if (file.endsWith('en-US.json')) return enJson;
      if (file.endsWith('es-ES.json')) return esJson;
      return '';
    });
    loadLocales({
      fsLib: mockFs,
      pathLib: mockPath,
      logger: mockLogger,
      localesDir: testDir
    });
    expect(locales['en-US'].help).toBe('Help text');
    expect(locales['es-ES'].help).toBe('Texto de ayuda');
  });

  it('logs error if directory read fails', () => {
    mockFs.readdirSync.mockImplementation(() => { throw new Error('fail'); });
    loadLocales({
      fsLib: mockFs,
      pathLib: mockPath,
      logger: mockLogger,
      localesDir: testDir
    });
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to read locales directory:'),
      expect.any(Error)
    );
  });

  it('logs error if file parse fails', () => {
    mockFs.readdirSync.mockReturnValue(['en-US.json']);
    mockFs.readFileSync.mockImplementation(() => '{bad json');
    loadLocales({
      fsLib: mockFs,
      pathLib: mockPath,
      logger: mockLogger,
      localesDir: testDir
    });
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to load or parse locale file en-US.json:'),
      expect.any(Error)
    );
  });

  it('getMsg returns correct message and falls back', () => {
    locales['en-US'] = { help: 'Help text' };
    delete locales['es-ES'];
    expect(getMsg('en-US', 'help', undefined, mockLogger)).toBe('Help text');
    delete locales['en-US'];
    expect(getMsg('es-ES', 'help', 'default', mockLogger)).toBe('default');
  });
});
