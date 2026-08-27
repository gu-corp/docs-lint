import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createNodeDocsLintSession } from '../node/editor-session.js';

const created: string[] = [];

function temporaryDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-lint-editor-'));
  created.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of created.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

describe('Node editor session', () => {
  it('binds an inherited configuration to docsRoot and describes effective provenance', async () => {
    const workspaceRoot = temporaryDirectory();
    const docsRoot = path.join(workspaceRoot, 'docs');
    const packRoot = path.join(workspaceRoot, 'standard');
    fs.mkdirSync(docsRoot);
    fs.mkdirSync(path.join(packRoot, 'templates'), { recursive: true });
    fs.writeFileSync(path.join(docsRoot, 'README.md'), '# Secret document body\n');
    fs.writeFileSync(path.join(packRoot, 'templates', 'guide.md'), '# {{productName}}\n');
    fs.writeFileSync(path.join(packRoot, 'pack.json'), JSON.stringify({
      schemaVersion: 1,
      id: 'example/editor',
      version: '2.1.0',
      title: { ja: '編集標準', en: 'Editor Standard' },
      description: 'Editor integration fixture',
      defaultProfile: 'editor',
      profiles: {
        editor: {
          title: 'Editor',
          documentTypes: ['guide'],
          rules: { 'markdown/headings': 'error' },
        },
      },
      documentTypes: {
        guide: {
          title: { ja: 'ガイド', en: 'Guide' },
          description: 'A generated guide',
          template: 'templates/guide.md',
          suggestedPath: 'GUIDE.md',
          variables: { productName: { required: true, description: 'Product name' } },
        },
      },
      rules: { 'content/terminology': 'info' },
    }));
    const configPath = path.join(workspaceRoot, 'docs-lint.config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      schemaVersion: 3,
      root: './wrong-root',
      standard: { pack: './standard', profile: 'editor' },
      rules: {
        'links/internal': { severity: 'warning', options: { allowFragments: true } },
      },
    }));

    const session = createNodeDocsLintSession({ workspaceRoot, docsRoot });
    const description = session.describe();
    expect(description.config).toEqual({
      source: 'docs-lint',
      file: configPath,
      directory: workspaceRoot,
      root: docsRoot,
    });
    expect(description.standard).toMatchObject({
      id: 'example/editor',
      version: '2.1.0',
      source: path.join(packRoot, 'pack.json'),
      profile: { id: 'editor', title: 'Editor', inheritance: ['editor'] },
    });
    expect(rule(description, 'links/internal')).toMatchObject({
      severity: 'warning', source: 'config', options: { allowFragments: true },
    });
    expect(rule(description, 'markdown/headings')).toMatchObject({ severity: 'error', source: 'profile' });
    expect(rule(description, 'content/terminology')).toMatchObject({ severity: 'info', source: 'pack' });
    expect(rule(description, 'markdown/code-fence-language')).toMatchObject({ severity: 'warning', source: 'default' });
    expect(JSON.stringify(description)).not.toContain('Secret document body');

    expect(session.listTemplates()).toEqual([{
      id: 'guide',
      title: { ja: 'ガイド', en: 'Guide' },
      description: 'A generated guide',
      suggestedPath: 'GUIDE.md',
      variables: { productName: { required: true, description: 'Product name' } },
    }]);
    expect(session.renderTemplate('guide', { productName: 'Lunascape' })).toBe('# Lunascape\n');

    const report = await session.lint({ only: ['links/internal'] });
    expect(report.root).toBe(docsRoot);
    expect(report.filesChecked).toBe(1);
  });

  it('uses root dot defaults and does not discover configuration above workspaceRoot', async () => {
    const outerRoot = temporaryDirectory();
    const workspaceRoot = path.join(outerRoot, 'workspace');
    const docsRoot = path.join(workspaceRoot, 'docs');
    fs.mkdirSync(docsRoot, { recursive: true });
    fs.writeFileSync(path.join(outerRoot, 'docs-lint.config.json'), JSON.stringify({
      schemaVersion: 3,
      root: './outside',
      rules: { 'markdown/headings': 'off' },
    }));
    fs.writeFileSync(path.join(docsRoot, 'README.md'), '# Documentation\n');

    const session = createNodeDocsLintSession({ workspaceRoot, docsRoot: 'docs' });
    const description = session.describe();
    expect(description.config).toEqual({ source: 'defaults', directory: docsRoot, root: docsRoot });
    expect(rule(description, 'markdown/headings')).toMatchObject({ severity: 'warning', source: 'default' });
    expect(description.standard).toBeUndefined();
    expect(session.listTemplates()).toEqual([]);
    expect(() => session.renderTemplate('guide')).toThrow(/No Standard Pack/);
    expect((await session.lint({ only: ['markdown/headings'] })).root).toBe(docsRoot);
  });

  it('rejects documentation and configuration paths outside workspaceRoot', () => {
    const workspaceRoot = temporaryDirectory();
    const outsideRoot = temporaryDirectory();
    fs.mkdirSync(path.join(workspaceRoot, 'docs'));
    const outsideConfig = path.join(outsideRoot, 'docs-lint.config.json');
    fs.writeFileSync(outsideConfig, JSON.stringify({ schemaVersion: 3, root: '.' }));

    expect(() => createNodeDocsLintSession({ workspaceRoot, docsRoot: outsideRoot })).toThrow(/docsRoot must be inside/);
    expect(() => createNodeDocsLintSession({
      workspaceRoot,
      docsRoot: 'docs',
      configPath: outsideConfig,
    })).toThrow(/configPath must be inside/);
  });

  it('rejects a documentation-root symlink that escapes workspaceRoot', () => {
    const workspaceRoot = temporaryDirectory();
    const outsideRoot = temporaryDirectory();
    fs.symlinkSync(outsideRoot, path.join(workspaceRoot, 'docs'), 'dir');

    expect(() => createNodeDocsLintSession({ workspaceRoot, docsRoot: 'docs' })).toThrow(/symlink must resolve inside/);
  });

  it('rejects an auto-discovered configuration symlink that escapes workspaceRoot', () => {
    const workspaceRoot = temporaryDirectory();
    const outsideRoot = temporaryDirectory();
    fs.mkdirSync(path.join(workspaceRoot, 'docs'));
    fs.writeFileSync(path.join(outsideRoot, 'docs-lint.config.json'), JSON.stringify({ schemaVersion: 3, root: '.' }));
    fs.symlinkSync(
      path.join(outsideRoot, 'docs-lint.config.json'),
      path.join(workspaceRoot, 'docs-lint.config.json'),
      'file',
    );

    expect(() => createNodeDocsLintSession({ workspaceRoot, docsRoot: 'docs' })).toThrow(/configPath symlink must resolve inside/);
  });

  it('rejects a lunascape-docs.json symlink that escapes workspaceRoot', () => {
    const workspaceRoot = temporaryDirectory();
    const outsideRoot = temporaryDirectory();
    const docsRoot = path.join(workspaceRoot, 'docs');
    fs.mkdirSync(docsRoot);
    fs.writeFileSync(path.join(outsideRoot, 'lunascape-docs.json'), JSON.stringify({
      documentStandards: { pack: 'builtin:gu-corp-software' },
    }));
    fs.symlinkSync(
      path.join(outsideRoot, 'lunascape-docs.json'),
      path.join(docsRoot, 'lunascape-docs.json'),
      'file',
    );

    expect(() => createNodeDocsLintSession({ workspaceRoot, docsRoot })).toThrow(/lunascape-docs\.json symlink must resolve inside/);
  });

  it('rejects local Standard Packs outside workspaceRoot and unsafe built-in names', () => {
    const workspaceRoot = temporaryDirectory();
    const outsideRoot = temporaryDirectory();
    const docsRoot = path.join(workspaceRoot, 'docs');
    fs.mkdirSync(docsRoot);
    fs.writeFileSync(path.join(docsRoot, 'README.md'), '# Documentation\n');
    const configPath = path.join(workspaceRoot, 'docs-lint.config.json');

    fs.writeFileSync(configPath, JSON.stringify({
      schemaVersion: 3,
      root: './docs',
      standard: { pack: outsideRoot },
    }));
    expect(() => createNodeDocsLintSession({ workspaceRoot, docsRoot })).toThrow(/standard\.pack must be inside/);

    fs.writeFileSync(configPath, JSON.stringify({
      schemaVersion: 3,
      root: './docs',
      standard: { pack: 'builtin:../gu-corp-software' },
    }));
    expect(() => createNodeDocsLintSession({ workspaceRoot, docsRoot })).toThrow(/Invalid built-in standard pack name/);
  });
});

function rule(description: ReturnType<ReturnType<typeof createNodeDocsLintSession>['describe']>, id: string) {
  const value = description.rules.find(item => item.id === id);
  expect(value, `Expected effective rule ${id}`).toBeDefined();
  return value!;
}
