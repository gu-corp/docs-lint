import type { LintResult } from '../types.js';
import type { CheckResult } from '../code/types.js';
import type { CoverageReport } from '../ai/types.js';
/**
 * Print lint results in human-readable format
 */
export declare function printResults(result: LintResult, verbose?: boolean): void;
/**
 * Print code check results
 */
export declare function printCodeCheckResults(result: CheckResult, verbose?: boolean): void;
/**
 * Print AI coverage report
 */
export declare function printCoverageReport(report: CoverageReport, verbose?: boolean): void;
/**
 * Generate progress bar
 */
export declare function getProgressBar(percentage: number): string;
//# sourceMappingURL=formatters.d.ts.map