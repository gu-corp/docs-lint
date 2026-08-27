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

  it('rejects a pack manifest symlink that escapes the pack root', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-lint-pack-root-'));
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-lint-pack-manifest-'));
    created.push(root, outside);
    fs.writeFileSync(path.join(outside, 'pack.json'), JSON.stringify({
      schemaVersion: 1,
      id: 'example/external-manifest',
      version: '1.0.0',
      title: 'External manifest',
      defaultProfile: 'base',
      profiles: { base: { title: 'Base', documentTypes: [] } },
      documentTypes: {},
    }));
    fs.symlinkSync(path.join(outside, 'pack.json'), path.join(root, 'pack.json'), 'file');

    expect(() => loadStandardPack(root)).toThrow(/manifest.*unsafe|symlink escapes/i);
  });

  it('rejects a template symlink that escapes the pack root', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-lint-pack-root-'));
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-lint-pack-template-'));
    created.push(root, outside);
    fs.mkdirSync(path.join(root, 'templates'));
    fs.writeFileSync(path.join(outside, 'document.md'), '# External template\n');
    fs.symlinkSync(path.join(outside, 'document.md'), path.join(root, 'templates', 'document.md'), 'file');
    fs.writeFileSync(path.join(root, 'pack.json'), JSON.stringify({
      schemaVersion: 1,
      id: 'example/external-template',
      version: '1.0.0',
      title: 'External template',
      defaultProfile: 'base',
      profiles: { base: { title: 'Base', documentTypes: ['document'] } },
      documentTypes: { document: { title: 'Document', template: 'templates/document.md' } },
    }));

    expect(() => loadStandardPack(root)).toThrow(/template|symlink escapes/i);
  });
});
