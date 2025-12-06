/**
 * Configuration for docs-lint
 */
export interface DocsLintConfig {
  /** Root directory for documentation (default: "./docs") */
  docsDir: string;

  /** File patterns to include */
  include: string[];

  /** File patterns to exclude */
  exclude: string[];

  /** Rules configuration */
  rules: RulesConfig;

  /** Terminology dictionary for consistency checks */
  terminology: TerminologyMapping[];

  /** Expected files that must exist */
  requiredFiles: string[];

  /** Requirement ID patterns for coverage tracking */
  requirementPatterns: RequirementPattern[];
}

export interface RulesConfig {
  /** Check for broken markdown links */
  brokenLinks: RuleSeverity;

  /** Check for legacy file name patterns */
  legacyFileNames: RuleSeverity | LegacyFileNamesConfig;

  /** Check for version info in documents */
  versionInfo: RuleSeverity | VersionInfoConfig;

  /** Check for related documents section */
  relatedDocuments: RuleSeverity | RelatedDocumentsConfig;

  /** Check heading hierarchy */
  headingHierarchy: RuleSeverity;

  /** Check for TODO/FIXME comments */
  todoComments: RuleSeverity;

  /** Check for code block language specifiers */
  codeBlockLanguage: RuleSeverity;

  /** Check for orphan documents */
  orphanDocuments: RuleSeverity;

  /** Check terminology consistency */
  terminology: RuleSeverity;

  /** Check bidirectional references */
  bidirectionalRefs: RuleSeverity;

  /** Check requirements coverage */
  requirementsCoverage: RuleSeverity;

  /** Check drafts folder structure (multilingual support) */
  draftStructure: RuleSeverity;
}

export type RuleSeverity = 'off' | 'warn' | 'error';

export interface LegacyFileNamesConfig {
  severity: RuleSeverity;
  /** Pattern to detect legacy file names (regex) */
  pattern: string;
  /** Files to exclude from this check */
  exclude: string[];
}

export interface VersionInfoConfig {
  severity: RuleSeverity;
  /** Patterns that indicate version info */
  patterns: string[];
  /** Only check files matching these globs */
  include: string[];
}

export interface RelatedDocumentsConfig {
  severity: RuleSeverity;
  /** Patterns that indicate related documents section */
  patterns: string[];
  /** Only check files matching these globs */
  include: string[];
}

export interface TerminologyMapping {
  /** Preferred term */
  preferred: string;
  /** Variants that should be replaced */
  variants: string[];
}

export interface RequirementPattern {
  /** Name of the requirement category */
  name: string;
  /** Regex pattern to match requirement IDs */
  pattern: string;
  /** File to extract requirements from */
  sourceFile: string;
  /** File to check for coverage */
  coverageFile: string;
}

/**
 * Lint result types
 */
export interface LintResult {
  /** Total number of files checked */
  filesChecked: number;

  /** Results by rule */
  ruleResults: RuleResult[];

  /** Overall pass/fail status */
  passed: boolean;

  /** Summary statistics */
  summary: LintSummary;
}

export interface RuleResult {
  /** Rule name */
  rule: string;

  /** Severity level */
  severity: RuleSeverity;

  /** Issues found */
  issues: LintIssue[];

  /** Did this rule pass? */
  passed: boolean;
}

export interface LintIssue {
  /** File path relative to docs root */
  file: string;

  /** Line number (1-based, optional) */
  line?: number;

  /** Issue message */
  message: string;

  /** Suggested fix (optional) */
  suggestion?: string;
}

export interface LintSummary {
  errors: number;
  warnings: number;
  passed: number;
}

/**
 * Default configuration
 */
export const defaultConfig: DocsLintConfig = {
  docsDir: './docs',
  include: ['**/*.md'],
  exclude: [],
  rules: {
    brokenLinks: 'error',
    legacyFileNames: 'error',
    versionInfo: 'warn',
    relatedDocuments: 'warn',
    headingHierarchy: 'warn',
    todoComments: 'warn',
    codeBlockLanguage: 'warn',
    orphanDocuments: 'warn',
    terminology: 'warn',
    bidirectionalRefs: 'off',
    requirementsCoverage: 'warn',
    draftStructure: 'warn',
  },
  terminology: [],
  requiredFiles: [],
  requirementPatterns: [],
};
