import type { LintIssue } from '../types.js';
export interface FolderStructureConfig {
    /** Expected folder structure with optional descriptions */
    folders: FolderDefinition[];
    /** Whether folder names should be numbered (e.g., 01-plan, 02-spec) */
    numberedFolders: boolean;
    /** Whether files should be in UPPER_CASE.md format */
    upperCaseFiles: boolean;
}
export interface FolderDefinition {
    /** Folder path relative to docs root */
    path: string;
    /** Description of the folder's purpose */
    description?: string;
    /** Whether this folder is required */
    required: boolean;
    /** Expected files in this folder */
    files?: string[];
}
/**
 * Check folder structure matches expected configuration
 */
export declare function checkFolderStructure(docsDir: string, config: FolderStructureConfig): Promise<LintIssue[]>;
/**
 * Check folder numbering consistency (01-, 02-, etc.)
 */
export declare function checkFolderNumbering(docsDir: string): Promise<LintIssue[]>;
/**
 * Check file naming conventions
 */
export declare function checkFileNaming(docsDir: string, files: string[], config: {
    upperCase: boolean;
    allowedPatterns?: RegExp[];
}): Promise<LintIssue[]>;
/**
 * Check for duplicate content/titles across documents
 */
export declare function checkDuplicateContent(docsDir: string, files: string[]): Promise<LintIssue[]>;
//# sourceMappingURL=structure.d.ts.map