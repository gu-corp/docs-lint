import type { LintIssue, RuleSeverity, LegacyFileNamesConfig, VersionInfoConfig, RelatedDocumentsConfig, StandardsDriftConfig } from '../types.js';
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
/**
 * Check for TODO/FIXME comments
 */
export declare function checkTodoComments(docsDir: string, files: string[]): Promise<LintIssue[]>;
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
export { checkI18nStructure, checkDraftStructure, checkFolderStructure, checkFolderNumbering, checkFileNaming, checkDuplicateContent, readDocsLanguageConfig, type DocsLanguageConfig, type FolderStructureConfig, type FolderDefinition, } from './structure.js';
//# sourceMappingURL=index.d.ts.map