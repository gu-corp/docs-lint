import type { DocsLintConfig, RuleSetting, Severity } from './types.js';

export const DEFAULT_RULES: Record<string, RuleSetting> = {
  'links/internal': 'error',
  'markdown/headings': 'warning',
  'markdown/code-fence-language': 'warning',
  'content/terminology': 'warning',
  'structure/standard-pack': 'error',
  'document/required-sections': 'warning',
  'traceability/requirements-tests': 'warning',
};

export const DEFAULT_CONFIG: DocsLintConfig = {
  schemaVersion: 3,
  root: './docs',
  include: ['**/*.md', '**/*.mdx'],
  exclude: ['**/node_modules/**', '**/.git/**', '**/.next/**', '**/dist/**', '**/build/**', '**/99-archive/**'],
  rules: {},
};

export function normalizeConfig(value: Partial<DocsLintConfig>): DocsLintConfig {
  if (value.schemaVersion !== undefined && value.schemaVersion !== 3) {
    throw new Error(`Unsupported docs-lint configuration schema: ${value.schemaVersion}. Run docs-lint migrate.`);
  }
  const config: DocsLintConfig = {
    ...DEFAULT_CONFIG,
    ...value,
    schemaVersion: 3,
    include: arrayOfStrings(value.include, DEFAULT_CONFIG.include),
    exclude: arrayOfStrings(value.exclude, DEFAULT_CONFIG.exclude),
    rules: { ...(value.rules || {}) },
  };
  for (const [ruleId, setting] of Object.entries(config.rules)) validateRuleSetting(ruleId, setting);
  if (config.standard && (!config.standard.pack || typeof config.standard.pack !== 'string')) {
    throw new Error('standard.pack must be a non-empty string.');
  }
  return config;
}

export function severityOf(setting: RuleSetting | undefined, fallback: Severity): Severity {
  if (!setting) return fallback;
  return typeof setting === 'string' ? setting : setting.severity;
}

export function optionsOf(setting: RuleSetting | undefined): Record<string, unknown> {
  return typeof setting === 'object' && setting.options ? setting.options : {};
}

export function isRuleSetting(value: unknown): value is RuleSetting {
  const severity = typeof value === 'string'
    ? value
    : value && typeof value === 'object' && 'severity' in value
      ? (value as { severity?: unknown }).severity
      : undefined;
  return typeof severity === 'string' && ['off', 'info', 'warning', 'error'].includes(severity);
}

function validateRuleSetting(ruleId: string, setting: RuleSetting): void {
  if (!isRuleSetting(setting)) throw new Error(`Invalid rule setting for ${ruleId}.`);
}

function arrayOfStrings(value: unknown, fallback: string[]): string[] {
  if (value === undefined) return [...fallback];
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) throw new Error('Expected an array of strings.');
  return [...value];
}
