import type { LintIssue } from '../types.js';
export interface DocsLanguageConfig {
    commonLanguage: string;
    draftLanguages?: string[];
    teams?: Record<string, string>;
}
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
/**
 * Read docs.config.json for language settings
 */
export declare function readDocsLanguageConfig(docsDir: string): DocsLanguageConfig | null;
/**
 * Check drafts folder structure and translation sync
 *
 * Expected structure:
 * docs/
 * ├── README.md              # Common language (Single Source of Truth)
 * ├── 01-plan/
 * │   └── PROPOSAL.md        # Common language
 * └── drafts/
 *     ├── ja/                # Japanese team drafts
 *     │   └── PROPOSAL.md
 *     └── vi/                # Vietnamese team drafts
 *         └── PROPOSAL.md
 */
export declare function checkDraftStructure(docsDir: string, langConfig: DocsLanguageConfig | null): Promise<LintIssue[]>;
//# sourceMappingURL=structure.d.ts.map