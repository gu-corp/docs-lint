import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createNodeDocsLintSession } from '@gu-corp/docs-lint/editor-runtime';

const root = mkdtempSync(path.join(tmpdir(), 'docs-lint-cli-'));
try {
  mkdirSync(path.join(root, 'docs'));
  const configPath = path.join(root, 'docs-lint.config.json');
  writeFileSync(configPath, JSON.stringify({
    schemaVersion: 3,
    root: './docs',
    standard: { pack: 'builtin:gu-corp-software', profile: 'web-application' },
  }));

  run(['pack', 'list', '--json']);
  run(['pack', 'validate', 'packs/gu-corp-software', '--json']);
  run(['create', 'customer-requirements', '--config', configPath, '--var', 'productName=Smoke Product', 'documentOwner=Smoke Owner']);
  const generated = readFileSync(path.join(root, 'docs/02-spec/01-requirements/REQUIREMENTS.md'), 'utf8');
  if (!generated.includes('Smoke Product') || generated.includes('{{')) throw new Error('create did not render the expected template.');
  const duplicate = execute(['create', 'customer-requirements', '--config', configPath, '--var', 'productName=Smoke Product', 'documentOwner=Smoke Owner']);
  if (duplicate.status === 0 || !duplicate.stderr.includes('already exists')) throw new Error('create did not refuse to overwrite an existing document.');

  const session = createNodeDocsLintSession({ workspaceRoot: root, docsRoot: path.join(root, 'docs') });
  const description = session.describe();
  if (description.standard?.id !== 'gu-corp/software-standard' || description.templates.length === 0) {
    throw new Error('Editor runtime did not load its configured Standard Pack.');
  }
  const report = await session.lint({ only: ['links/internal'] });
  if (report.root !== path.join(root, 'docs') || report.filesChecked === 0) {
    throw new Error('Editor runtime did not lint the requested documentation root.');
  }

  const runtime = readFileSync(path.resolve('dist/editor-runtime.mjs'), 'utf8');
  const imports = [...runtime.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)].map(match => match[1]);
  const builtins = new Set(builtinModules.flatMap(name => [name, `node:${name}`]));
  const thirdPartyImports = imports.filter(source => !source.startsWith('.') && !builtins.has(source));
  if (thirdPartyImports.length) {
    throw new Error(`Editor runtime contains unbundled third-party imports: ${thirdPartyImports.join(', ')}`);
  }

  const v2Path = path.join(root, 'v2.json');
  const v3Path = path.join(root, 'v3.json');
  writeFileSync(v2Path, JSON.stringify({ docsDir: './docs', rules: { brokenLinks: 'error', headingHierarchy: 'warn' } }));
  run(['migrate', '--from', v2Path, '--to', v3Path]);
  const migrated = JSON.parse(readFileSync(v3Path, 'utf8'));
  if (migrated.schemaVersion !== 3 || migrated.root !== './docs' || migrated.rules['markdown/headings'] !== 'warning') {
    throw new Error('migrate did not produce the expected v3 configuration.');
  }
  console.log('CLI and editor runtime smoke tests passed.');
} finally {
  rmSync(root, { recursive: true, force: true });
}

function run(arguments_) {
  const result = execute(arguments_);
  if (result.status !== 0) throw new Error(`docs-lint ${arguments_.join(' ')} failed:\n${result.stderr || result.stdout}`);
  return result;
}

function execute(arguments_) {
  return spawnSync(process.execPath, [path.resolve('dist/cli.js'), ...arguments_], {
    cwd: path.resolve('.'),
    encoding: 'utf8',
  });
}
