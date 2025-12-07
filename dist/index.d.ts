export { DocsLinter, createLinter, type LinterOptions } from './linter.js';
export type { DocsLintConfig, RulesConfig, RuleSeverity, LegacyFileNamesConfig, VersionInfoConfig, RelatedDocumentsConfig, TerminologyMapping, RequirementPattern, LintResult, RuleResult, LintIssue, LintSummary, } from './types.js';
export { defaultConfig } from './types.js';
export { checkBrokenLinks, checkLegacyFileNames, checkVersionInfo, checkRelatedDocuments, checkHeadingHierarchy, checkTodoComments, checkCodeBlockLanguage, checkOrphanDocuments, checkTerminology, checkBidirectionalRefs, checkRequiredFiles, } from './rules/index.js';
export { checkFolderStructure, checkFolderNumbering, checkFileNaming, checkDuplicateContent, type FolderStructureConfig, type FolderDefinition, } from './rules/structure.js';
export { generateAIPrompt, generateJSONSummary, readStandardsFile } from './ai/prompt.js';
export { createAnalyzer } from './ai/analyzer.js';
export type { AnalyzerOptions, CoverageReport, Requirement, RequirementCoverage } from './ai/types.js';
export { createChecker } from './code/checker.js';
export type { SpecCheckerConfig, CheckResult, RuleResult as CodeRuleResult } from './code/types.js';
export { defaultConfig as codeDefaultConfig } from './code/types.js';
//# sourceMappingURL=index.d.ts.map