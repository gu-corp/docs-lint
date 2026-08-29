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

  it('anchors untested requirements at their definition so editors can open them', async () => {
    const root = temp();
    fs.writeFileSync(path.join(root, 'REQUIREMENTS.md'), [
      '---',
      'title: Requirements',
      '---',
      '# Requirements',
      '',
      '- FR-DOC-001 is covered',
      '- FR-DOC-002 is not covered, and FR-DOC-002 repeats',
      '',
    ].join('\n'));
    fs.writeFileSync(path.join(root, 'TEST-PLAN.md'), '# Tests\n\n- TC-001 verifies FR-DOC-001\n');
    const config = resolved(root, { rules: { 'traceability/requirements-tests': 'warning' } });
    const report = await lintWorkspace(config, { only: ['traceability/requirements-tests'] });
    expect(report.diagnostics).toEqual([{
      ruleId: 'traceability/requirements-tests',
      severity: 'warning',
      message: 'Requirement has no test reference: FR-DOC-002',
      file: 'REQUIREMENTS.md',
      location: { line: 7, column: 3 },
      data: { requirementId: 'FR-DOC-002', status: 'uncovered' },
    }]);
  });

  it('classifies requirement coverage as covered, deferred, excluded or uncovered', async () => {
    const root = temp();
    fs.mkdirSync(path.join(root, '02-spec', '01-requirements'), { recursive: true });
    fs.mkdirSync(path.join(root, '02-spec', '03-testing'), { recursive: true });
    fs.writeFileSync(path.join(root, '02-spec', '01-requirements', 'REQUIREMENTS.md'), [
      '# Requirements',
      '',
      '| ID | Title |',
      '| --- | --- |',
      '| FR-DOC-001 | covered by a unit test |',
      '| FR-DOC-002 | deferred |',
      '| FR-DOC-003 | excluded |',
      '| FR-DOC-004 | uncovered |',
      '| NFR-PERF-001 | mentioned without a test case ID |',
      '',
    ].join('\n'));
    fs.writeFileSync(path.join(root, '02-spec', '03-testing', 'TEST-PLAN.md'), [
      '# Test plan',
      '',
      '- TC-U001 [FR-DOC-001] happy path',
      '- TC-D001 [FR-DOC-002] later release',
      '- TC-X001 [FR-DOC-003] out of scope',
      '- Performance target NFR-PERF-001 is verified manually',
      '',
    ].join('\n'));
    const config = resolved(root, {
      rules: { 'traceability/requirements-tests': 'warning' },
      traceability: { requiredCoverage: 1 },
    });
    const report = await lintWorkspace(config, { only: ['traceability/requirements-tests'] });
    const byId = new Map(report.diagnostics.filter(item => item.data?.requirementId).map(item => [item.data!.requirementId, item]));
    expect([...byId.keys()].sort()).toEqual(['FR-DOC-002', 'FR-DOC-004']);
    expect(byId.get('FR-DOC-002')).toMatchObject({ severity: 'info', file: '02-spec/01-requirements/REQUIREMENTS.md', location: { line: 6, column: 3 } });
    expect(byId.get('FR-DOC-004')).toMatchObject({ severity: 'warning', location: { line: 8, column: 3 } });
    const coverage = report.diagnostics.find(item => item.data?.requiredCoverage !== undefined);
    expect(coverage?.data).toMatchObject({ requirements: 5, covered: 2, excluded: 1 });
    expect(coverage?.message).toMatch(/50\.0%/);
  });

  it('reports requirement and test documents without IDs and missing test documents', async () => {
    const root = temp();
    fs.writeFileSync(path.join(root, 'REQUIREMENTS.md'), '# Requirements\n\nNo identifiers yet.\n');
    fs.writeFileSync(path.join(root, 'REQUIREMENTS-SYSTEM.md'), '# System\n\n- SR-001 stores data\n');
    const config = resolved(root, { rules: { 'traceability/requirements-tests': 'warning' } });
    const missingTests = await lintWorkspace(config, { only: ['traceability/requirements-tests'] });
    expect(missingTests.diagnostics.map(item => [item.file, item.message])).toEqual([
      ['REQUIREMENTS.md', 'Requirement document has no requirement IDs.'],
      [undefined, 'Requirements exist but no test document was found.'],
    ]);

    fs.writeFileSync(path.join(root, 'TEST-PLAN.md'), '# Tests\n\nWe will test things.\n');
    const emptyTests = await lintWorkspace(config, { only: ['traceability/requirements-tests'] });
    expect(emptyTests.diagnostics.map(item => item.message)).toEqual([
      'Requirement document has no requirement IDs.',
      'Test document has no test case IDs.',
      'Requirements exist but no test case IDs were found.',
      'Requirement has no test reference: SR-001',
    ]);

    const relaxed = resolved(root, {
      rules: { 'traceability/requirements-tests': 'warning' },
      traceability: { requireRequirementIds: false, requireTestCaseIds: false },
    });
    const relaxedReport = await lintWorkspace(relaxed, { only: ['traceability/requirements-tests'] });
    expect(relaxedReport.diagnostics.map(item => item.message)).toEqual([
      'Requirements exist but no test case IDs were found.',
      'Requirement has no test reference: SR-001',
    ]);
  });

  it('flags malformed and duplicated requirement IDs, ignoring code', async () => {
    const root = temp();
    fs.writeFileSync(path.join(root, 'REQUIREMENTS.md'), [
      '# Requirements',
      '',
      '| ID | Title |',
      '| --- | --- |',
      '| FR-DOC-001 | fine |',
      '| FR001 | missing hyphen |',
      '| fr-002 | lowercase |',
      '| FR_003 | underscore |',
      '| FR-doc-4 | lowercase segment |',
      '| FR-DOC-001 | duplicate |',
      '',
      '## FR-DOC-001',
      '',
      'Body mentions FR-DOC-001 again, which is a reference rather than a definition.',
      '',
      '```text',
      'FR999 inside code is ignored',
      '```',
      '',
      'Inline `FR998` is ignored too.',
      '',
    ].join('\n'));
    const config = resolved(root, { rules: { 'traceability/requirement-ids': 'warning' } });
    const report = await lintWorkspace(config, { only: ['traceability/requirement-ids'] });
    expect(report.diagnostics.map(item => [item.message, item.location?.line])).toEqual([
      ['Requirement ID does not follow the configured pattern: FR001', 6],
      ['Requirement ID does not follow the configured pattern: fr-002', 7],
      ['Requirement ID does not follow the configured pattern: FR_003', 8],
      ['Requirement ID does not follow the configured pattern: FR-doc-4', 9],
      ['Requirement ID is defined more than once: FR-DOC-001 (first defined in REQUIREMENTS.md:5)', 10],
      ['Requirement ID is defined more than once: FR-DOC-001 (first defined in REQUIREMENTS.md:5)', 12],
    ]);
    expect(report.diagnostics.every(item => item.file === 'REQUIREMENTS.md')).toBe(true);
  });

  it('reports requirement references that no requirement document defines', async () => {
    const root = temp();
    fs.mkdirSync(path.join(root, 'design'), { recursive: true });
    fs.writeFileSync(path.join(root, 'REQUIREMENTS.md'), '# Requirements\n\n- FR-DOC-001 exists\n');
    fs.writeFileSync(path.join(root, 'design', 'ARCHITECTURE.md'), [
      '# Architecture',
      '',
      'Implements FR-DOC-001 and FR-DOC-002; see also FR-DOC-002 again and `FR-DOC-003` in code.',
      '',
    ].join('\n'));
    fs.writeFileSync(path.join(root, 'TEST-PLAN.md'), '# Tests\n\n- TC-U001 [FR-DOC-009]\n');
    const config = resolved(root, { rules: { 'traceability/requirement-references': 'warning' } });
    const report = await lintWorkspace(config, { only: ['traceability/requirement-references'] });
    expect(report.diagnostics.map(item => [item.file, item.message, item.location])).toEqual([
      ['TEST-PLAN.md', 'Referenced requirement is not defined in any requirement document: FR-DOC-009', { line: 3, column: 12 }],
      ['design/ARCHITECTURE.md', 'Referenced requirement is not defined in any requirement document: FR-DOC-002', { line: 3, column: 27 }],
    ]);

    const none = await lintWorkspace(resolved(temp(), { rules: { 'traceability/requirement-references': 'warning' } }), { only: ['traceability/requirement-references'] });
    expect(none.diagnostics).toEqual([]);
  });

  it('keeps root-wide traceability diagnostics without a file', async () => {
    const root = temp();
    fs.writeFileSync(path.join(root, 'REQUIREMENTS.md'), '# Requirements\n\n- FR-DOC-001\n');
    fs.writeFileSync(path.join(root, 'TEST-PLAN.md'), '# Tests\n\nNothing identified yet.\n');
    const config = resolved(root, {
      rules: { 'traceability/requirements-tests': 'warning' },
      traceability: { requiredCoverage: 1 },
    });
    const report = await lintWorkspace(config, { only: ['traceability/requirements-tests'] });
    const rootWide = report.diagnostics.filter(item => item.file === undefined);
    expect(rootWide.map(item => item.message)).toEqual([
      'Requirements exist but no test case IDs were found.',
      'Requirement test coverage is 0.0%; required 100.0%.',
    ]);
    expect(rootWide.every(item => item.location === undefined)).toBe(true);
    expect(report.diagnostics.find(item => item.file === 'REQUIREMENTS.md')?.location).toEqual({ line: 3, column: 3 });
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
