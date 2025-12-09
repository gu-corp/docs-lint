interface ReviewPromptOptions {
    docsDir: string;
    srcDir?: string;
    verbose?: boolean;
}
interface CodeReviewPromptOptions {
    docsDir: string;
    srcDir: string;
    specPatterns?: string[];
    sourcePatterns?: string[];
    verbose?: boolean;
}
/**
 * Generate a specification review prompt for chat AI
 * Purpose: "Can engineers implement accurately without confusion from this spec?"
 */
export declare function generateSpecReviewPrompt(options: ReviewPromptOptions): string;
/**
 * Generate a code review prompt for requirement coverage analysis
 * Purpose: "Is this code production-ready? Written by a professional?"
 */
export declare function generateCodeReviewPrompt(options: CodeReviewPromptOptions): string;
/**
 * Generate a design-implementation consistency review prompt
 */
export declare function generateDesignReviewPrompt(options: ReviewPromptOptions): string;
export {};
//# sourceMappingURL=review-prompt.d.ts.map