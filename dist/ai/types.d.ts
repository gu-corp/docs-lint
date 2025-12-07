/**
 * Types for AI-based requirement coverage analysis
 */
export interface Requirement {
    /** Unique identifier (auto-generated or from doc) */
    id: string;
    /** Requirement description */
    description: string;
    /** Category (functional, api, ui, etc.) */
    category: string;
    /** Source document */
    sourceFile: string;
    /** Line number in source */
    line?: number;
    /** Priority if specified */
    priority?: 'high' | 'medium' | 'low';
}
export interface RequirementCoverage {
    /** The requirement */
    requirement: Requirement;
    /** Implementation status */
    status: 'implemented' | 'partial' | 'not_implemented' | 'unknown';
    /** Confidence score (0-100) */
    confidence: number;
    /** Files that implement this requirement */
    implementedIn: string[];
    /** Evidence/reasoning */
    evidence: string;
    /** Suggestions for completion */
    suggestion?: string;
}
export interface CoverageReport {
    /** Total requirements found */
    totalRequirements: number;
    /** Coverage statistics */
    coverage: {
        implemented: number;
        partial: number;
        notImplemented: number;
        unknown: number;
    };
    /** Coverage percentage */
    percentage: number;
    /** Detailed coverage by requirement */
    details: RequirementCoverage[];
    /** Summary by category */
    byCategory: Record<string, {
        total: number;
        implemented: number;
        percentage: number;
    }>;
}
export interface AnalyzerOptions {
    /** Specification documents directory */
    docsDir: string;
    /** Source code directory */
    srcDir: string;
    /** Spec files to analyze (glob patterns) */
    specPatterns: string[];
    /** Source files to check (glob patterns) */
    sourcePatterns: string[];
    /** Model to use */
    model?: string;
    /** Verbose output */
    verbose?: boolean;
}
export interface SpecReviewOptions {
    /** Documentation directory */
    docsDir: string;
    /** Document standards file content (optional) */
    standards?: string;
    /** Model to use */
    model?: string;
    /** Verbose output */
    verbose?: boolean;
    /** Terminology list for consistency checks */
    terminology?: Array<{
        preferred: string;
        variants: string[];
    }>;
}
export interface DocumentInfo {
    /** File path relative to docs dir */
    path: string;
    /** Document title */
    title?: string;
    /** Document content */
    content: string;
    /** Has version info */
    hasVersion: boolean;
    /** Has related documents section */
    hasRelatedDocs: boolean;
    /** Section headings */
    headings: string[];
}
export interface SpecIssue {
    /** Issue category */
    category: 'structure' | 'terminology' | 'consistency' | 'completeness' | 'reference';
    /** Severity level */
    severity: 'error' | 'warning' | 'info';
    /** File where issue was found */
    file: string;
    /** Line number (optional) */
    line?: number;
    /** Issue description */
    message: string;
    /** Suggested fix */
    suggestion?: string;
    /** Confidence score (0-100) */
    confidence: number;
}
export interface SpecReviewReport {
    /** Total documents reviewed */
    totalDocuments: number;
    /** Issues found */
    issues: SpecIssue[];
    /** Summary by category */
    byCategory: Record<string, {
        total: number;
        errors: number;
        warnings: number;
    }>;
    /** Overall quality score (0-100) */
    qualityScore: number;
    /** Documents without issues */
    passedDocuments: number;
    /** AI-generated summary */
    summary: string;
    /** Recommendations */
    recommendations: string[];
}
//# sourceMappingURL=types.d.ts.map