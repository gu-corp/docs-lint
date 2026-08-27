import type { LoadedStandardPack, ResolvedStandardProfile } from '../standards/types.js';

export type Severity = 'off' | 'info' | 'warning' | 'error';

export interface RuleSettingObject {
  severity: Severity;
  options?: Record<string, unknown>;
}

export type RuleSetting = Severity | RuleSettingObject;

export interface StandardSelection {
  pack: string;
  profile?: string;
}

export interface TraceabilityConfig {
  requirementPattern?: string;
  testCasePattern?: string;
  requirementFiles?: string[];
  testFiles?: string[];
  requiredCoverage?: number;
}

export interface DocsLintConfig {
  $schema?: string;
  schemaVersion: 3;
  root: string;
  include: string[];
  exclude: string[];
  standard?: StandardSelection;
  rules: Record<string, RuleSetting>;
  terminology?: Array<{
    preferred: string;
    variants: string[];
    locale?: string;
  }>;
  traceability?: TraceabilityConfig;
}

export interface ResolvedDocsLintConfig extends DocsLintConfig {
  configPath?: string;
  configDirectory: string;
  rootPath: string;
}

export interface DocumentFile {
  path: string;
  absolutePath: string;
  content: string;
  frontMatter: Record<string, string>;
  body: string;
}

export interface DiagnosticLocation {
  line?: number;
  column?: number;
}

export interface DiagnosticFix {
  description: string;
  replacement?: string;
}

export interface Diagnostic {
  ruleId: string;
  severity: Exclude<Severity, 'off'>;
  message: string;
  file?: string;
  location?: DiagnosticLocation;
  fix?: DiagnosticFix;
  data?: Record<string, unknown>;
}

export interface RuleContext {
  config: ResolvedDocsLintConfig;
  documents: DocumentFile[];
  documentPaths: ReadonlySet<string>;
  pathExists(relativePath: string): boolean;
  standardPack?: LoadedStandardPack;
  standardProfile?: ResolvedStandardProfile;
  options: Record<string, unknown>;
}

export interface RuleDefinition {
  id: string;
  description: string;
  defaultSeverity: Severity;
  run(context: RuleContext): Promise<Diagnostic[]> | Diagnostic[];
}

export interface RuleExecution {
  ruleId: string;
  severity: Severity;
  durationMs: number;
  diagnostics: Diagnostic[];
}

export interface LintReport {
  schemaVersion: 1;
  root: string;
  filesChecked: number;
  passed: boolean;
  summary: {
    errors: number;
    warnings: number;
    information: number;
  };
  executions: RuleExecution[];
  diagnostics: Diagnostic[];
}
