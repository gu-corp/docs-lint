import type { LintResult, DocsLintConfig } from './types.js';
export declare const STANDARDS_FILES: string[];
interface DocsLanguageConfig {
    commonLanguage: string;
    draftLanguages?: string[];
    teams?: Record<string, string>;
}
/**
 * Read docs.config.json for language settings
 */
export declare function readDocsConfig(docsDir: string): DocsLanguageConfig | null;
/**
 * Find and read the document standards file
 * Falls back to default G.U.Corp standards if not found
 */
export declare function readStandardsFile(docsDir: string, useDefault?: boolean): {
    content: string;
    isDefault: boolean;
};
/**
 * Generate an AI-friendly prompt for document quality assessment
 */
export declare function generateAIPrompt(docsDir: string, files: string[], lintResult: LintResult, config: DocsLintConfig): string;
/**
 * Generate a compact JSON summary for API consumption
 */
export declare function generateJSONSummary(docsDir: string, files: string[], lintResult: LintResult): object;
export {};
//# sourceMappingURL=ai-prompt.d.ts.map