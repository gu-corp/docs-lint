import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { writeDocument } from '../node/workspace.js';

const created: string[] = [];
afterEach(() => { for (const directory of created.splice(0)) fs.rmSync(directory, { recursive: true, force: true }); });

describe('safe document writes', () => {
  it('does not overwrite unless force is explicit', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-lint-write-'));
    created.push(root);
    writeDocument(root, 'README.md', '# One\n');
    expect(() => writeDocument(root, 'README.md', '# Two\n')).toThrow(/already exists/);
    writeDocument(root, 'README.md', '# Two\n', true);
    expect(fs.readFileSync(path.join(root, 'README.md'), 'utf8')).toBe('# Two\n');
  });

  it('rejects a parent symlink that escapes the documentation root', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-lint-root-'));
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-lint-outside-'));
    created.push(root, outside);
    fs.symlinkSync(outside, path.join(root, 'linked'), 'dir');
    expect(() => writeDocument(root, 'linked/escape.md', '# Escape\n')).toThrow(/symlink escapes/);
    expect(fs.existsSync(path.join(outside, 'escape.md'))).toBe(false);
  });
});
