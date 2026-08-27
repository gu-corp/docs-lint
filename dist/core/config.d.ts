import type { RuleSetting, Severity } from '../contracts/rule-setting.js';
import type { DocsLintConfig } from './types.js';
export declare const DEFAULT_RULES: Record<string, RuleSetting>;
export declare const DEFAULT_CONFIG: DocsLintConfig;
export declare function normalizeConfig(value: Partial<DocsLintConfig>): DocsLintConfig;
export declare function severityOf(setting: RuleSetting | undefined, fallback: Severity): Severity;
export declare function optionsOf(setting: RuleSetting | undefined): Record<string, unknown>;
export declare function isRuleSetting(value: unknown): value is RuleSetting;
export declare function hasRuleSeverity(setting: RuleSetting | undefined): boolean;
export declare function hasRuleOptions(setting: RuleSetting | undefined): boolean;
export interface ResolvedRuleSettingLayers {
    severity?: {
        setting: RuleSetting;
        index: number;
    };
    options?: {
        setting: RuleSetting;
        index: number;
    };
}
/**
 * Preserves the pre-3.2 winner-takes-all behavior when the highest-priority
 * setting declares severity. Only an options-only winner inherits severity
 * from a lower layer; its options never come from a lower layer.
 */
export declare function resolveRuleSettingLayers(candidates: readonly unknown[]): ResolvedRuleSettingLayers;
//# sourceMappingURL=config.d.ts.map