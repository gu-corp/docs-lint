import type { DocsLintConfig, RuleSetting, Severity } from './types.js';
export declare const DEFAULT_RULES: Record<string, RuleSetting>;
export declare const DEFAULT_CONFIG: DocsLintConfig;
export declare function normalizeConfig(value: Partial<DocsLintConfig>): DocsLintConfig;
export declare function severityOf(setting: RuleSetting | undefined, fallback: Severity): Severity;
export declare function optionsOf(setting: RuleSetting | undefined): Record<string, unknown>;
export declare function isRuleSetting(value: unknown): value is RuleSetting;
//# sourceMappingURL=config.d.ts.map