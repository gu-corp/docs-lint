import type { RuleSetting, Severity } from '../contracts/rule-setting.js';
import type { DocsLintConfig } from './types.js';

export const DEFAULT_RULES: Record<string, RuleSetting> = {
  'links/internal': 'error',
  'markdown/headings': 'warning',
  'markdown/code-fence-language': 'warning',
  'content/terminology': 'warning',
  'structure/standard-pack': 'error',
  'document/required-sections': 'warning',
  'traceability/requirements-tests': 'warning',
  'traceability/requirement-ids': 'warning',
  'traceability/requirement-references': 'warning',
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
  return typeof setting === 'string' ? setting : setting.severity ?? fallback;
}

export function optionsOf(setting: RuleSetting | undefined): Record<string, unknown> {
  return typeof setting === 'object' && setting.options ? setting.options : {};
}

export function isRuleSetting(value: unknown): value is RuleSetting {
  if (typeof value === 'string') return isSeverity(value);
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  if (!keys.length || keys.some(key => key !== 'severity' && key !== 'options')) return false;
  if (value.severity === undefined && value.options === undefined) return false;
  if (value.severity !== undefined && !isSeverity(value.severity)) return false;
  return value.options === undefined || isRecord(value.options);
}

export function hasRuleSeverity(setting: RuleSetting | undefined): boolean {
  return typeof setting === 'string' || Boolean(setting && setting.severity !== undefined);
}

export function hasRuleOptions(setting: RuleSetting | undefined): boolean {
  return Boolean(setting && typeof setting === 'object' && setting.options !== undefined);
}

export interface ResolvedRuleSettingLayers {
  severity?: { setting: RuleSetting; index: number };
  options?: { setting: RuleSetting; index: number };
}

/**
 * Preserves the pre-3.2 winner-takes-all behavior when the highest-priority
 * setting declares severity. Only an options-only winner inherits severity
 * from a lower layer; its options never come from a lower layer.
 */
export function resolveRuleSettingLayers(candidates: readonly unknown[]): ResolvedRuleSettingLayers {
  const topIndex = candidates.findIndex(isRuleSetting);
  if (topIndex < 0) return {};
  const top = candidates[topIndex] as RuleSetting;
  if (hasRuleSeverity(top)) {
    return {
      severity: { setting: top, index: topIndex },
      ...(hasRuleOptions(top) ? { options: { setting: top, index: topIndex } } : {}),
    };
  }
  const inheritedIndex = candidates.findIndex((candidate, index) => index > topIndex
    && isRuleSetting(candidate) && hasRuleSeverity(candidate));
  return {
    ...(inheritedIndex >= 0 ? { severity: { setting: candidates[inheritedIndex] as RuleSetting, index: inheritedIndex } } : {}),
    options: { setting: top, index: topIndex },
  };
}

function validateRuleSetting(ruleId: string, setting: RuleSetting): void {
  if (!isRuleSetting(setting)) throw new Error(`Invalid rule setting for ${ruleId}.`);
}

function isSeverity(value: unknown): value is Severity {
  return typeof value === 'string' && ['off', 'info', 'warning', 'error'].includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function arrayOfStrings(value: unknown, fallback: string[]): string[] {
  if (value === undefined) return [...fallback];
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) throw new Error('Expected an array of strings.');
  return [...value];
}
