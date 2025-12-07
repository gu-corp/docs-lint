import type { CheckIssue, RuleSeverity, TestFileExistsConfig, TestTypeCoverageConfig, CriticalPath, TestPatterns } from '../types.js';
/**
 * Check if source files have corresponding test files
 */
export declare function checkTestFileExists(srcDir: string, sourceFiles: string[], testFiles: string[], config: TestFileExistsConfig | RuleSeverity): Promise<CheckIssue[]>;
/**
 * Check test type coverage (unit, integration, E2E)
 */
export declare function checkTestTypeCoverage(srcDir: string, sourceFiles: string[], testPatterns: TestPatterns, testDirs: string[], config: TestTypeCoverageConfig | RuleSeverity): Promise<CheckIssue[]>;
/**
 * Check critical paths have E2E tests
 */
export declare function checkCriticalE2E(srcDir: string, sourceFiles: string[], e2ePattern: string, testDirs: string[], criticalPaths: CriticalPath[]): Promise<CheckIssue[]>;
//# sourceMappingURL=index.d.ts.map