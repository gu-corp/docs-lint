import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadConfig } from '../node/config.js';
import { normalizeConfig } from '../core/config.js';

const created: string[] = [];
function temporaryDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-lint-config-'));
  created.push(directory);
  return directory;
}
afterEach(() => { for (const directory of created.splice(0)) fs.rmSync(directory, { recursive: true, force: true }); });

describe('loadConfig', () => {
  it('loads schema v3 and inherits a Standard Pack from lunascape-docs.json', () => {
    const root = temporaryDirectory();
    fs.mkdirSync(path.join(root, 'docs'));
    fs.writeFileSync(path.join(root, 'docs-lint.config.json'), JSON.stringify({ schemaVersion: 3, root: './docs' }));
    fs.writeFileSync(path.join(root, 'docs', 'lunascape-docs.json'), JSON.stringify({
      documentStandards: { pack: '../standards/team', profile: 'api-service' },
    }));
    const config = loadConfig({ configPath: path.join(root, 'docs-lint.config.json') });
    expect(config.schemaVersion).toBe(3);
    expect(config.rootPath).toBe(path.join(root, 'docs'));
    expect(config.standard).toEqual({ pack: path.join(root, 'standards/team'), profile: 'api-service' });
  });

  it('rejects v2 configurations instead of silently guessing', () => {
    const root = temporaryDirectory();
    const configPath = path.join(root, 'docs-lint.config.json');
    fs.writeFileSync(configPath, JSON.stringify({ docsDir: './docs', rules: {} }));
    expect(() => loadConfig({ configPath })).toThrow(/requires schemaVersion: 3/);
  });

  it('accepts options-only rule objects and rejects empty or malformed objects', () => {
    expect(normalizeConfig({
      schemaVersion: 3,
      root: '.',
      rules: { 'example/rule': { options: { strict: true } } },
    }).rules['example/rule']).toEqual({ options: { strict: true } });

    expect(() => normalizeConfig({
      schemaVersion: 3,
      root: '.',
      rules: { 'example/rule': {} },
    })).toThrow(/Invalid rule setting/);
    expect(() => normalizeConfig({
      schemaVersion: 3,
      root: '.',
      rules: { 'example/rule': { options: [] } },
    })).toThrow(/Invalid rule setting/);
  });
});
