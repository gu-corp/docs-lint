export { DocsLinter, createLinter, type LinterOptions } from './linter.js';
export type { DocsLintConfig, RulesConfig, RuleSeverity, LegacyFileNamesConfig, VersionInfoConfig, RelatedDocumentsConfig, TerminologyMapping, RequirementPattern, LintResult, RuleResult, LintIssue, LintSummary, } from './types.js';
export { defaultConfig } from './types.js';
export { checkBrokenLinks, checkLegacyFileNames, checkVersionInfo, checkRelatedDocuments, checkHeadingHierarchy, checkTodoComments, checkCodeBlockLanguage, checkOrphanDocuments, checkTerminology, checkBidirectionalRefs, checkRequiredFiles, } from './rules/index.js';
export { checkFolderStructure, checkFolderNumbering, checkFileNaming, checkDuplicateContent, type FolderStructureConfig, type FolderDefinition, } from './rules/structure.js';
export { generateAIPrompt, generateJSONSummary } from './ai-prompt.js';
//# sourceMappingURL=index.d.ts.map