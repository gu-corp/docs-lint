import type { LintIssue, I18nConfig, FolderNumberingConfig, RuleSeverity, StandardFileNamesConfig } from '../types.js';
/**
 * G.U.Corp standard folder structure definition
 */
export declare const STANDARD_FOLDER_STRUCTURE: FolderDefinition[];
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
    /** Required files in this folder (must exist if folder exists) */
    files?: string[];
    /** Optional files - if present, must follow this naming convention */
    optionalFiles?: string[];
}
/**
 * Check folder structure matches expected configuration
 */
export declare function checkFolderStructure(docsDir: string, config: FolderStructureConfig): Promise<LintIssue[]>;
/**
 * Check G.U.Corp standard folder structure
 * This enforces the recommended structure for all projects
 */
export declare function checkStandardFolderStructure(docsDir: string): Promise<LintIssue[]>;
/**
 * Check folder numbering consistency (01-, 02-, etc.)
 *
 * Config example:
 * {
 *   severity: 'warn',
 *   strictPaths: ['', '02-spec'],  // '' = top-level, '02-spec' = 02-spec subfolders
 *   checkSequence: true
 * }
 *
 * Default: Check top-level and 02-spec subfolders (G.U.Corp standard)
 */
export declare function checkFolderNumbering(docsDir: string, config?: FolderNumberingConfig | RuleSeverity): Promise<LintIssue[]>;
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
/**
 * Check for standard file naming patterns
 * - Warn when *-DETAIL.md files exist (should be split into folders)
 * - Warn when conflicting files exist (e.g., UI.md + SCREEN.md)
 */
export declare function checkStandardFileNames(docsDir: string, files: string[], config?: StandardFileNamesConfig | RuleSeverity): Promise<LintIssue[]>;
//# sourceMappingURL=structure.d.ts.map