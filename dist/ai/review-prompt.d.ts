interface ReviewPromptOptions {
    docsDir: string;
    srcDir?: string;
    verbose?: boolean;
}
/**
 * Generate a review prompt for chat AI (Claude Code) instead of API call
 * This allows using the current chat context without API key
 */
export declare function generateSpecReviewPrompt(options: ReviewPromptOptions): string;
/**
 * Generate a design-implementation consistency review prompt
 */
export declare function generateDesignReviewPrompt(options: ReviewPromptOptions): string;
export {};
//# sourceMappingURL=review-prompt.d.ts.map