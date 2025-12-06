// Main exports
export { DocsLinter, createLinter, type LinterOptions } from './linter.js';

// Type exports
export type {
  DocsLintConfig,
  RulesConfig,
  RuleSeverity,
  LegacyFileNamesConfig,
  VersionInfoConfig,
  RelatedDocumentsConfig,
  TerminologyMapping,
  RequirementPattern,
  LintResult,
  RuleResult,
  LintIssue,
  LintSummary,
} from './types.js';

export { defaultConfig } from './types.js';

// Rule exports
export {
  checkBrokenLinks,
  checkLegacyFileNames,
  checkVersionInfo,
  checkRelatedDocuments,
  checkHeadingHierarchy,
  checkTodoComments,
  checkCodeBlockLanguage,
  checkOrphanDocuments,
  checkTerminology,
  checkBidirectionalRefs,
  checkRequiredFiles,
} from './rules/index.js';

// Structure rule exports
export {
  checkFolderStructure,
  checkFolderNumbering,
  checkFileNaming,
  checkDuplicateContent,
  type FolderStructureConfig,
  type FolderDefinition,
} from './rules/structure.js';

// AI prompt exports
export { generateAIPrompt, generateJSONSummary } from './ai-prompt.js';
