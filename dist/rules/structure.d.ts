import type { LintIssue, I18nConfig } from '../types.js';
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
 * Check i18n file structure using translations folder convention
 *
 * Expected folder structure:
 * docs/
 * ├── 01-plan/
 * │   └── PROPOSAL.md              # Source (main location)
 * └── translations/
 *     ├── ja/                       # Source language copy
 *     │   └── 01-plan/
 *     │       └── PROPOSAL.md
 *     └── en/                       # Translation
 *         └── 01-plan/
 *             └── PROPOSAL.md
 *
 * Configuration:
 * {
 *   "i18n": {
 *     "sourceLanguage": "ja",
 *     "targetLanguages": ["en"],
 *     "translationsFolder": "translations"
 *   }
 * }
 */
export declare function checkI18nStructure(docsDir: string, files: string[], i18nConfig: I18nConfig | undefined): Promise<LintIssue[]>;
/**
 * Legacy: Check drafts folder structure
 * @deprecated Use checkI18nStructure with language suffix convention instead
 */
export declare function checkDraftStructure(docsDir: string, langConfig: DocsLanguageConfig | null): Promise<LintIssue[]>;
//# sourceMappingURL=structure.d.ts.map