import { optionsOf, resolveRuleSettingLayers, severityOf } from './config.js';
import { terminologyRule } from './rules/content.js';
import { codeFenceLanguageRule, headingsRule, internalLinksRule } from './rules/markdown.js';
import { requiredSectionsRule, standardStructureRule } from './rules/standard.js';
import { requirementsTestsRule } from './rules/traceability.js';
export const BUILTIN_RULES = [
    internalLinksRule,
    headingsRule,
    codeFenceLanguageRule,
    terminologyRule,
    standardStructureRule,
    requiredSectionsRule,
    requirementsTestsRule,
];
export class DocsLintEngine {
    rules = new Map();
    constructor(rules = BUILTIN_RULES) {
        for (const rule of rules)
            this.register(rule);
    }
    register(rule) {
        if (!rule.id.includes('/'))
            throw new Error(`Rule id must be namespaced: ${rule.id}`);
        if (this.rules.has(rule.id))
            throw new Error(`Rule is already registered: ${rule.id}`);
        this.rules.set(rule.id, rule);
    }
    availableRules() { return [...this.rules.values()]; }
    async lint(input) {
        validateRuleSelection(input.only, this.rules, '--only');
        validateRuleSelection(input.skip, this.rules, '--skip');
        const documentPaths = new Set(input.documents.map(document => document.path));
        const executions = [];
        for (const rule of this.rules.values()) {
            if (input.only?.length && !input.only.includes(rule.id))
                continue;
            if (input.skip?.includes(rule.id))
                continue;
            const setting = resolveRuleSetting(input, rule.id);
            const severity = severityOf(setting.severity?.setting, rule.defaultSeverity);
            if (severity === 'off')
                continue;
            const context = {
                config: input.config,
                documents: input.documents,
                documentPaths,
                pathExists: input.pathExists,
                standardPack: input.standardPack,
                standardProfile: input.standardProfile,
                options: optionsOf(setting.options?.setting),
            };
            const started = performance.now();
            let diagnostics;
            try {
                diagnostics = await rule.run(context);
            }
            catch (error) {
                diagnostics = [{ ruleId: rule.id, severity: 'error', message: `Rule failed: ${error instanceof Error ? error.message : String(error)}` }];
            }
            diagnostics = diagnostics.map(diagnostic => ({
                ...diagnostic,
                ruleId: rule.id,
                severity: severity === 'info' ? 'info' : severity,
            }));
            executions.push({ ruleId: rule.id, severity, durationMs: performance.now() - started, diagnostics });
        }
        const diagnostics = executions.flatMap(execution => execution.diagnostics);
        const summary = {
            errors: diagnostics.filter(item => item.severity === 'error').length,
            warnings: diagnostics.filter(item => item.severity === 'warning').length,
            information: diagnostics.filter(item => item.severity === 'info').length,
        };
        return {
            schemaVersion: 1,
            root: input.config.rootPath,
            filesChecked: input.documents.length,
            passed: summary.errors === 0,
            summary,
            executions,
            diagnostics,
        };
    }
}
function resolveRuleSetting(input, ruleId) {
    return resolveRuleSettingLayers([
        input.config.rules[ruleId],
        input.standardProfile?.rules?.[ruleId],
        input.standardPack?.manifest.rules?.[ruleId],
    ]);
}
function validateRuleSelection(values, rules, option) {
    for (const value of values || [])
        if (!rules.has(value))
            throw new Error(`${option} references an unknown rule: ${value}`);
}
//# sourceMappingURL=engine.js.map