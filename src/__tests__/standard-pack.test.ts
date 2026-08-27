import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { bundledPacksRoot, loadStandardPack, renderTemplate } from '../node/standard-pack.js';
import { resolveStandardProfile } from '../standards/manifest.js';

const created: string[] = [];
afterEach(() => { for (const directory of created.splice(0)) fs.rmSync(directory, { recursive: true, force: true }); });

describe('Standard Pack loading and rendering', () => {
  it('loads every bundled template and renders without unresolved variables', () => {
    const loaded = loadStandardPack(path.join(bundledPacksRoot(), 'gu-corp-software'));
    const profile = resolveStandardProfile(loaded.manifest, 'regulated-financial-product');
    for (const documentType of profile.documentTypes || []) {
      const rendered = renderTemplate(loaded, profile, documentType, {
        productName: 'Example Product',
        documentOwner: 'Product Owner',
      });
      expect(rendered).toContain('Example Product');
      expect(rendered).not.toMatch(/\{\{[^}]+\}\}/);
    }
  });

  it('rejects missing required variables', () => {
    const loaded = loadStandardPack(path.join(bundledPacksRoot(), 'gu-corp-software'));
    const profile = resolveStandardProfile(loaded.manifest, 'web-application');
    expect(() => renderTemplate(loaded, profile, 'customer-requirements')).toThrow(/productName, documentOwner/);
  });

  it('rejects template paths outside the pack root', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-lint-pack-'));
    created.push(root);
    fs.writeFileSync(path.join(root, 'pack.json'), JSON.stringify({
      schemaVersion: 1,
      id: 'example/unsafe',
      version: '1.0.0',
      title: 'Unsafe',
      defaultProfile: 'base',
      profiles: { base: { title: 'Base', documentTypes: ['doc'] } },
      documentTypes: { doc: { title: 'Doc', template: '../outside.md' } },
    }));
    expect(() => loadStandardPack(root)).toThrow(/safe relative path|escapes/);
  });
});
