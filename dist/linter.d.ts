import { type DocsLintConfig, type LintResult, type RuleResult } from './types.js';
import { type FolderStructureConfig } from './rules/structure.js';
export interface LinterOptions {
    /** Enable verbose output */
    verbose?: boolean;
    /** Only run specific rules */
    only?: string[];
    /** Skip specific rules */
    skip?: string[];
}
/**
 * Main linter class
 */
export declare class DocsLinter {
    private config;
    private options;
    constructor(config: DocsLintConfig, options?: LinterOptions);
    /**
     * Run all enabled rules and return results
     */
    lint(): Promise<LintResult>;
    /**
     * Run folder structure checks
     */
    lintStructure(structureConfig: FolderStructureConfig): Promise<RuleResult[]>;
    /**
     * Get all markdown files matching config patterns
     */
    private getFiles;
    /**
     * Check if a rule should run
     */
    private shouldRun;
    /**
     * Run a single rule and wrap in RuleResult
     */
    private runRule;
    /**
     * Get severity for a rule
     */
    private getRuleSeverity;
}
/**
 * Create a linter with configuration
 */
export declare function createLinter(config: Partial<DocsLintConfig>, options?: LinterOptions): DocsLinter;
//# sourceMappingURL=linter.d.ts.map