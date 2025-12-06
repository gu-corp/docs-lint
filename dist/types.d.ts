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
    /** i18n configuration for multilingual documents */
    i18n?: I18nConfig;
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
    /** Check i18n file structure (language suffix convention) */
    i18nStructure: RuleSeverity;
    /** Check required files exist */
    requiredFiles: RuleSeverity;
    /** Check folder structure matches expected configuration */
    folderStructure: RuleSeverity;
    /** Check folder numbering consistency */
    folderNumbering: RuleSeverity | FolderNumberingConfig;
    /** Check file naming conventions */
    fileNaming: RuleSeverity;
    /** Check for duplicate content/titles */
    duplicateContent: RuleSeverity;
    /** Check if development standards files match templates */
    standardsDrift: RuleSeverity | StandardsDriftConfig;
}
export interface StandardsDriftConfig {
    severity: RuleSeverity;
    /** Template categories to check (default: ["04-development"]) */
    categories: string[];
    /** Whether to report missing files */
    reportMissing: boolean;
    /** Whether to report different files */
    reportDifferent: boolean;
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
export interface FolderNumberingConfig {
    severity: RuleSeverity;
    /** Paths that require strict numbering (e.g., ["", "02-spec"]) */
    strictPaths: string[];
    /** Whether to check for gaps in numbering sequence */
    checkSequence: boolean;
}
export interface TerminologyMapping {
    /** Preferred term */
    preferred: string;
    /** Variants that should be replaced */
    variants: string[];
}
export interface I18nConfig {
    /** Source language code (e.g., "ja", "en") - the authoritative version */
    sourceLanguage: string;
    /** Target languages for translations */
    targetLanguages?: string[];
    /** Translations folder name (default: "translations") */
    translationsFolder?: string;
    /** Whether to check translation sync (default: false) */
    checkSync?: boolean;
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
export declare const defaultConfig: DocsLintConfig;
//# sourceMappingURL=types.d.ts.map