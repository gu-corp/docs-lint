import { isRuleSetting, optionsOf, severityOf } from './config.js';
import type {
  Diagnostic,
  DocumentFile,
  LintReport,
  ResolvedDocsLintConfig,
  RuleContext,
  RuleDefinition,
  RuleExecution,
  RuleSetting,
} from './types.js';
import type { LoadedStandardPack, ResolvedStandardProfile } from '../standards/types.js';
import { terminologyRule } from './rules/content.js';
import { codeFenceLanguageRule, headingsRule, internalLinksRule } from './rules/markdown.js';
import { requiredSectionsRule, standardStructureRule } from './rules/standard.js';
import { requirementsTestsRule } from './rules/traceability.js';

export const BUILTIN_RULES: RuleDefinition[] = [
  internalLinksRule,
  headingsRule,
  codeFenceLanguageRule,
  terminologyRule,
  standardStructureRule,
  requiredSectionsRule,
  requirementsTestsRule,
];

export interface EngineInput {
  config: ResolvedDocsLintConfig;
  documents: DocumentFile[];
  pathExists(relativePath: string): boolean;
  standardPack?: LoadedStandardPack;
  standardProfile?: ResolvedStandardProfile;
  only?: string[];
  skip?: string[];
}

export class DocsLintEngine {
  private readonly rules = new Map<string, RuleDefinition>();

  constructor(rules: RuleDefinition[] = BUILTIN_RULES) {
    for (const rule of rules) this.register(rule);
  }

  register(rule: RuleDefinition): void {
    if (!rule.id.includes('/')) throw new Error(`Rule id must be namespaced: ${rule.id}`);
    if (this.rules.has(rule.id)) throw new Error(`Rule is already registered: ${rule.id}`);
    this.rules.set(rule.id, rule);
  }

  availableRules(): RuleDefinition[] { return [...this.rules.values()]; }

  async lint(input: EngineInput): Promise<LintReport> {
    validateRuleSelection(input.only, this.rules, '--only');
    validateRuleSelection(input.skip, this.rules, '--skip');
    const documentPaths = new Set(input.documents.map(document => document.path));
    const executions: RuleExecution[] = [];
    for (const rule of this.rules.values()) {
      if (input.only?.length && !input.only.includes(rule.id)) continue;
      if (input.skip?.includes(rule.id)) continue;
      const setting = resolveRuleSetting(input, rule.id);
      const severity = severityOf(setting, rule.defaultSeverity);
      if (severity === 'off') continue;
      const context: RuleContext = {
        config: input.config,
        documents: input.documents,
        documentPaths,
        pathExists: input.pathExists,
        standardPack: input.standardPack,
        standardProfile: input.standardProfile,
        options: optionsOf(setting),
      };
      const started = performance.now();
      let diagnostics: Diagnostic[];
      try {
        diagnostics = await rule.run(context);
      } catch (error) {
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

function resolveRuleSetting(input: EngineInput, ruleId: string): RuleSetting | undefined {
  const candidates = [
    input.config.rules[ruleId],
    input.standardProfile?.rules?.[ruleId],
    input.standardPack?.manifest.rules?.[ruleId],
  ];
  for (const candidate of candidates) if (isRuleSetting(candidate)) return candidate;
  return undefined;
}

function validateRuleSelection(values: string[] | undefined, rules: Map<string, RuleDefinition>, option: string): void {
  for (const value of values || []) if (!rules.has(value)) throw new Error(`${option} references an unknown rule: ${value}`);
}
