import type { SpecReviewOptions, SpecReviewReport } from './types.js';
export declare class SpecAnalyzer {
    private client;
    private options;
    private model;
    constructor(options: SpecReviewOptions);
    /**
     * Review all documentation for quality issues
     */
    review(): Promise<SpecReviewReport>;
    /**
     * Get all markdown files in docs directory
     */
    private getDocFiles;
    /**
     * Read and parse documents
     */
    private readDocuments;
    /**
     * Load document standards
     */
    private loadStandards;
    /**
     * Analyze documents using AI
     */
    private analyzeDocuments;
    /**
     * Check terminology consistency
     */
    private checkTerminology;
    /**
     * Calculate category statistics
     */
    private calculateCategoryStats;
}
/**
 * Create spec analyzer instance
 */
export declare function createSpecAnalyzer(options: SpecReviewOptions): SpecAnalyzer;
//# sourceMappingURL=spec-analyzer.d.ts.map