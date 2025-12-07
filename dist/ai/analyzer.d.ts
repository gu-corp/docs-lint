import type { CoverageReport, AnalyzerOptions } from './types.js';
export declare class RequirementAnalyzer {
    private client;
    private options;
    private model;
    constructor(options: AnalyzerOptions);
    /**
     * Analyze requirement coverage against tests
     */
    analyze(): Promise<CoverageReport>;
    /**
     * Get specification files
     */
    private getSpecFiles;
    /**
     * Get test files
     */
    private getTestFiles;
    /**
     * Extract requirements from spec files using AI
     */
    private extractRequirements;
    /**
     * Check if a requirement has corresponding tests
     */
    private checkTestCoverage;
    /**
     * Generate coverage report
     */
    private generateReport;
}
/**
 * Create analyzer instance
 */
export declare function createAnalyzer(options: AnalyzerOptions): RequirementAnalyzer;
//# sourceMappingURL=analyzer.d.ts.map