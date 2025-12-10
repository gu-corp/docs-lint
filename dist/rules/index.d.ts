import type { LintIssue, RuleSeverity, LegacyFileNamesConfig, VersionInfoConfig, RelatedDocumentsConfig, StandardsDriftConfig, RequirementTestMappingConfig, MarkdownLintConfig, TodoCommentsConfig } from '../types.js';
/**
 * Check for broken markdown links
 */
export declare function checkBrokenLinks(docsDir: string, files: string[]): Promise<LintIssue[]>;
/**
 * Check for legacy file name patterns
 */
export declare function checkLegacyFileNames(docsDir: string, files: string[], config: LegacyFileNamesConfig | RuleSeverity): Promise<LintIssue[]>;
/**
 * Check for version info in documents
 */
export declare function checkVersionInfo(docsDir: string, files: string[], config: VersionInfoConfig | RuleSeverity): Promise<LintIssue[]>;
/**
 * Check for related documents section
 */
export declare function checkRelatedDocuments(docsDir: string, files: string[], config: RelatedDocumentsConfig | RuleSeverity): Promise<LintIssue[]>;
/**
 * Check heading hierarchy
 */
export declare function checkHeadingHierarchy(docsDir: string, files: string[]): Promise<LintIssue[]>;
export declare function checkTodoComments(docsDir: string, files: string[], config: TodoCommentsConfig | RuleSeverity): Promise<LintIssue[]>;
/**
 * Check for code block language specifiers
 */
export declare function checkCodeBlockLanguage(docsDir: string, files: string[]): Promise<LintIssue[]>;
/**
 * Check for orphan documents
 */
export declare function checkOrphanDocuments(docsDir: string, files: string[], exclude?: string[]): Promise<LintIssue[]>;
/**
 * Check terminology consistency
 */
export declare function checkTerminology(docsDir: string, files: string[], terminology: {
    preferred: string;
    variants: string[];
    exceptions?: string[];
    wordBoundary?: boolean;
}[]): Promise<LintIssue[]>;
/**
 * Check bidirectional references
 */
export declare function checkBidirectionalRefs(docsDir: string, files: string[]): Promise<LintIssue[]>;
/**
 * Check required files exist
 */
export declare function checkRequiredFiles(docsDir: string, requiredFiles: string[]): Promise<LintIssue[]>;
/**
 * Check if development standards files match templates
 */
export declare function checkStandardsDrift(docsDir: string, templatesDir: string, config: StandardsDriftConfig | RuleSeverity): Promise<LintIssue[]>;
/**
 * Check requirement to test case mapping
 * Ensures all functional requirements have corresponding test cases
 */
export declare function checkRequirementTestMapping(docsDir: string, files: string[], config: RequirementTestMappingConfig | RuleSeverity): Promise<LintIssue[]>;
/**
 * Check markdown formatting using markdownlint
 */
export declare function checkMarkdownLint(docsDir: string, files: string[], config: MarkdownLintConfig | RuleSeverity): Promise<LintIssue[]>;
/**
 * Fix markdown formatting issues using markdownlint
 * Returns the number of files fixed
 */
export declare function fixMarkdownLint(docsDir: string, files: string[], config: MarkdownLintConfig | RuleSeverity): Promise<{
    fixed: number;
    errors: string[];
}>;
export { checkI18nStructure, checkDraftStructure, checkFolderStructure, checkFolderNumbering, checkFileNaming, checkDuplicateContent, readDocsLanguageConfig, type DocsLanguageConfig, type FolderStructureConfig, type FolderDefinition, } from './structure.js';
//# sourceMappingURL=index.d.ts.map