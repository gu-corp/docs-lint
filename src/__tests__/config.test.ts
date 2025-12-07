import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '../cli/config.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

describe('loadConfig', () => {
  let originalCwd: string;
  let tmpDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-lint-config-test-'));
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('should return default config when no config file exists', async () => {
    const config = await loadConfig();

    expect(config).toBeDefined();
    expect(config.docsDir).toBe('./docs');
    expect(config.rules).toBeDefined();
  });

  it('should load config from docs-lint.config.json', async () => {
    fs.writeFileSync(
      path.join(tmpDir, 'docs-lint.config.json'),
      JSON.stringify({
        docsDir: './documentation',
        rules: { brokenLinks: 'off' },
      })
    );

    const config = await loadConfig();

    expect(config.docsDir).toBe('./documentation');
    expect(config.rules.brokenLinks).toBe('off');
  });

  it('should override docsDir when provided as parameter', async () => {
    const config = await loadConfig(undefined, './custom-docs');

    expect(config.docsDir).toBe('./custom-docs');
  });

  it('should merge rules with defaults', async () => {
    fs.writeFileSync(
      path.join(tmpDir, 'docs-lint.config.json'),
      JSON.stringify({
        rules: { brokenLinks: 'off' },
      })
    );

    const config = await loadConfig();

    expect(config.rules.brokenLinks).toBe('off');
    // Other rules should still have default values
    expect(config.rules.headingHierarchy).toBeDefined();
  });
});
