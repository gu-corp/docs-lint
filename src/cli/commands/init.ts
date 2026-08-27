import fs from 'fs';
import path from 'path';
import type { Command } from 'commander';
import { writeDefaultConfig } from '../../node/config.js';

export function registerInitCommand(program: Command): void {
  program.command('init')
    .description('Create an explicit docs-lint v3 configuration')
    .option('-r, --root <path>', 'Documentation root', './docs')
    .option('--pack <source>', 'Standard Pack source', 'builtin:gu-corp-software')
    .option('--profile <id>', 'Standard Pack profile', 'web-application')
    .action(options => {
      const target = path.resolve('docs-lint.config.json');
      writeDefaultConfig(target, options.root, options.pack ? { pack: options.pack, profile: options.profile } : undefined);
      console.log(`Created ${target}`);
    });

  program.command('migrate')
    .description('Convert a v2 JSON configuration to the explicit v3 schema')
    .option('--from <path>', 'v2 configuration', 'docs-lint.config.json')
    .option('--to <path>', 'v3 output', 'docs-lint.v3.config.json')
    .action(options => {
      const source = path.resolve(options.from);
      const parsed = JSON.parse(fs.readFileSync(source, 'utf8')) as unknown;
      if (!isRecord(parsed)) throw new Error('v2 configuration must be a JSON object.');
      const oldRules = isRecord(parsed.rules) ? parsed.rules : {};
      const rules: Record<string, unknown> = {};
      const mapping: Record<string, string> = {
        brokenLinks: 'links/internal',
        headingHierarchy: 'markdown/headings',
        codeBlockLanguage: 'markdown/code-fence-language',
        terminology: 'content/terminology',
        standardFolderStructure: 'structure/standard-pack',
        requirementTestMapping: 'traceability/requirements-tests',
      };
      for (const [oldId, newId] of Object.entries(mapping)) {
        const value = oldRules[oldId];
        if (value !== undefined) rules[newId] = migrateSeverity(value);
      }
      const migrated = {
        schemaVersion: 3,
        root: typeof parsed.docsDir === 'string' ? parsed.docsDir : './docs',
        include: stringArray(parsed.include, ['**/*.md', '**/*.mdx']),
        exclude: stringArray(parsed.exclude, []),
        standard: { pack: 'builtin:gu-corp-software', profile: 'web-application' },
        rules,
        terminology: Array.isArray(parsed.terminology) ? parsed.terminology : [],
      };
      const target = path.resolve(options.to);
      fs.writeFileSync(target, `${JSON.stringify(migrated, null, 2)}\n`, { flag: 'wx' });
      console.log(`Created ${target}. Review the Standard Pack profile and removed v2-only rules before replacing the old config.`);
    });
}

function migrateSeverity(value: unknown): unknown {
  if (typeof value === 'string') return value === 'warn' ? 'warning' : value;
  if (isRecord(value)) return { ...value, severity: value.severity === 'warn' ? 'warning' : value.severity };
  return value;
}

function stringArray(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string') ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
