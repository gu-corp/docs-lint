import { type SpecCheckerConfig, type CheckResult } from './types.js';
export interface CheckerOptions {
    /** Enable verbose output */
    verbose?: boolean;
    /** Only run specific rules */
    only?: string[];
    /** Skip specific rules */
    skip?: string[];
}
/**
 * Main checker class
 */
export declare class SpecChecker {
    private config;
    private options;
    constructor(config: SpecCheckerConfig, options?: CheckerOptions);
    /**
     * Run all enabled rules and return results
     */
    check(): Promise<CheckResult>;
    /**
     * Get all source files matching config patterns
     */
    private getSourceFiles;
    /**
     * Get all test files
     */
    private getTestFiles;
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
 * Create a checker with configuration
 */
export declare function createChecker(config: Partial<SpecCheckerConfig>, options?: CheckerOptions): SpecChecker;
//# sourceMappingURL=checker.d.ts.map