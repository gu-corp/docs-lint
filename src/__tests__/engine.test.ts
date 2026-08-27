import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DocsLintEngine } from '../core/engine.js';
import { normalizeConfig } from '../core/config.js';
import type { DocumentFile, ResolvedDocsLintConfig, RuleDefinition } from '../core/types.js';
import { lintWorkspace } from '../node/run.js';
import { bundledPacksRoot, loadStandardPack, renderTemplate } from '../node/standard-pack.js';
import { resolveStandardProfile } from '../standards/manifest.js';

const created: string[] = [];
function temp(): string { const value = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-lint-engine-')); created.push(value); return value; }
afterEach(() => { for (const directory of created.splice(0)) fs.rmSync(directory, { recursive: true, force: true }); });

function resolved(root: string, extra = {}): ResolvedDocsLintConfig {
  return { ...normalizeConfig({ schemaVersion: 3, root: '.', ...extra }), rootPath: root, configDirectory: root };
}

describe('DocsLintEngine', () => {
  it('uses configuration over profile and pack severity defaults', async () => {
    let receivedOptions: Record<string, unknown> | undefined;
    const rule: RuleDefinition = {
      id: 'test/failure', description: 'test', defaultSeverity: 'info',
      run: context => {
        receivedOptions = context.options;
        return [{ ruleId: '', severity: 'warning', message: 'failure' }];
      },
    };
    const pack = loadStandardPack(path.join(bundledPacksRoot(), 'gu-corp-software'));
    pack.manifest.rules = { 'test/failure': 'warning' };
    const profile = resolveStandardProfile(pack.manifest, 'web-application');
    profile.rules = { 'test/failure': { severity: 'error', options: { lower: true } } };
    const root = temp();
    const report = await new DocsLintEngine([rule]).lint({
      config: resolved(root, { rules: { 'test/failure': 'info' } }),
      documents: [], pathExists: () => false, standardPack: pack, standardProfile: profile,
    });
    expect(report.diagnostics[0].severity).toBe('info');
    expect(receivedOptions).toEqual({});
  });

  it('inherits severity independently while retaining options from configuration', async () => {
    let receivedOptions: Record<string, unknown> | undefined;
    const rule: RuleDefinition = {
      id: 'test/options-only', description: 'test', defaultSeverity: 'info',
      run: context => {
        receivedOptions = context.options;
        return [{ ruleId: '', severity: 'warning', message: 'failure' }];
      },
    };
    const pack = loadStandardPack(path.join(bundledPacksRoot(), 'gu-corp-software'));
    pack.manifest.rules = { 'test/options-only': 'warning' };
    const profile = resolveStandardProfile(pack.manifest, 'web-application');
    profile.rules = { 'test/options-only': 'error' };
    const report = await new DocsLintEngine([rule]).lint({
      config: resolved(temp(), { rules: { 'test/options-only': { options: { strict: true } } } }),
      documents: [], pathExists: () => false, standardPack: pack, standardProfile: profile,
    });

    expect(report.executions[0].severity).toBe('error');
    expect(report.diagnostics[0].severity).toBe('error');
    expect(receivedOptions).toEqual({ strict: true });

    profile.rules = { 'test/options-only': { options: { profile: true } } };
    const packReport = await new DocsLintEngine([rule]).lint({
      config: resolved(temp(), { rules: { 'test/options-only': { options: { strict: true } } } }),
      documents: [], pathExists: () => false, standardPack: pack, standardProfile: profile,
    });
    expect(packReport.executions[0].severity).toBe('warning');
    expect(receivedOptions).toEqual({ strict: true });

    pack.manifest.rules = { 'test/options-only': { options: { pack: true } } };
    const defaultReport = await new DocsLintEngine([rule]).lint({
      config: resolved(temp(), { rules: { 'test/options-only': { options: { strict: true } } } }),
      documents: [], pathExists: () => false, standardPack: pack, standardProfile: profile,
    });
    expect(defaultReport.executions[0].severity).toBe('info');
    expect(receivedOptions).toEqual({ strict: true });
  });

  it('rejects unknown rule selectors', async () => {
    await expect(new DocsLintEngine().lint({
      config: resolved(temp()), documents: [], pathExists: () => false, only: ['missing/rule'],
    })).rejects.toThrow(/unknown rule/);
  });
});

describe('workspace lint', () => {
  it('reports missing standard structure and required documents', async () => {
    const root = temp();
    fs.writeFileSync(path.join(root, 'README.md'), '# Root\n');
    const config = resolved(root, {
      standard: { pack: 'builtin:gu-corp-software', profile: 'web-application' },
      rules: { 'structure/standard-pack': 'error' },
    });
    const report = await lintWorkspace(config, { only: ['structure/standard-pack'] });
    expect(report.passed).toBe(false);
    expect(report.diagnostics.some(item => item.file === '02-spec/01-requirements/REQUIREMENTS.md')).toBe(true);
  });

  it('accepts a complete generated standard document set', async () => {
    const root = temp();
    const loaded = loadStandardPack(path.join(bundledPacksRoot(), 'gu-corp-software'));
    const profile = resolveStandardProfile(loaded.manifest, 'web-application');
    for (const folder of loaded.manifest.structure || []) if (folder.required) fs.mkdirSync(path.join(root, folder.path), { recursive: true });
    for (const documentTypeId of profile.requiredDocuments || []) {
      const type = loaded.manifest.documentTypes[documentTypeId];
      const target = path.join(root, type.suggestedPath!);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, renderTemplate(loaded, profile, documentTypeId, { productName: 'Example', documentOwner: 'Owner' }));
    }
    const config = resolved(root, {
      standard: { pack: 'builtin:gu-corp-software', profile: 'web-application' },
      rules: {
        'structure/standard-pack': 'error',
        'document/required-sections': 'error',
        'links/internal': 'error',
      },
    });
    const report = await lintWorkspace(config, { only: ['structure/standard-pack', 'document/required-sections', 'links/internal'] });
    expect(report.diagnostics).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
