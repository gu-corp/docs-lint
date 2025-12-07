/**
 * Configuration for spec-checker
 */
export interface SpecCheckerConfig {
    /** Source directory to check (default: "./src") */
    srcDir: string;
    /** Test directory patterns */
    testDirs: string[];
    /** Source file patterns to check */
    sourcePatterns: string[];
    /** Test file patterns */
    testPatterns: TestPatterns;
    /** Rules configuration */
    rules: RulesConfig;
    /** Files/directories to exclude */
    exclude: string[];
    /** Critical paths that require E2E tests */
    criticalPaths: CriticalPath[];
}
export interface TestPatterns {
    /** Unit test file pattern */
    unit: string;
    /** Integration test file pattern */
    integration: string;
    /** E2E test file pattern */
    e2e: string;
}
export interface RulesConfig {
    /** Check if source files have corresponding test files */
    testFileExists: RuleSeverity | TestFileExistsConfig;
    /** Check test type coverage (unit, integration, E2E) */
    testTypeCoverage: RuleSeverity | TestTypeCoverageConfig;
    /** Check code coverage thresholds */
    coverageThreshold: RuleSeverity | CoverageThresholdConfig;
    /** Check critical paths have E2E tests */
    criticalE2E: RuleSeverity;
}
export type RuleSeverity = 'off' | 'warn' | 'error';
export interface TestFileExistsConfig {
    severity: RuleSeverity;
    /** Minimum percentage of source files that must have tests */
    minCoverage: number;
    /** Paths that are exempt from this check */
    exempt: string[];
}
export interface TestTypeCoverageConfig {
    severity: RuleSeverity;
    /** Require unit tests for lib/ files */
    requireUnit: boolean;
    /** Require integration tests for api/ files */
    requireIntegration: boolean;
    /** Require E2E for critical flows */
    requireE2E: boolean;
}
export interface CoverageThresholdConfig {
    severity: RuleSeverity;
    /** Coverage thresholds by category */
    thresholds: {
        /** Utility functions coverage */
        utilities: number;
        /** Business logic coverage */
        businessLogic: number;
        /** API endpoints coverage */
        api: number;
        /** UI components coverage */
        ui: number;
    };
}
export interface CriticalPath {
    /** Name of the critical path */
    name: string;
    /** Description */
    description: string;
    /** File patterns involved */
    patterns: string[];
    /** Required test type */
    requiredTestType: 'unit' | 'integration' | 'e2e';
}
/**
 * Check result types
 */
export interface CheckResult {
    /** Total number of source files checked */
    sourceFilesChecked: number;
    /** Total number of test files found */
    testFilesFound: number;
    /** Results by rule */
    ruleResults: RuleResult[];
    /** Overall pass/fail status */
    passed: boolean;
    /** Summary statistics */
    summary: CheckSummary;
}
export interface RuleResult {
    /** Rule name */
    rule: string;
    /** Severity level */
    severity: RuleSeverity;
    /** Issues found */
    issues: CheckIssue[];
    /** Did this rule pass? */
    passed: boolean;
}
export interface CheckIssue {
    /** File path relative to src root */
    file: string;
    /** Issue message */
    message: string;
    /** Suggested fix (optional) */
    suggestion?: string;
}
export interface CheckSummary {
    errors: number;
    warnings: number;
    passed: number;
    coverage: {
        sourceFiles: number;
        testedFiles: number;
        percentage: number;
    };
}
/**
 * Default configuration
 */
export declare const defaultConfig: SpecCheckerConfig;
//# sourceMappingURL=types.d.ts.map