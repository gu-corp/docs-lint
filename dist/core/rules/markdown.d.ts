import type { RuleDefinition } from '../types.js';
export declare const internalLinksRule: RuleDefinition;
export declare const headingsRule: RuleDefinition;
export declare const codeFenceLanguageRule: RuleDefinition;
export declare function markdownHeadings(markdown: string): Array<{
    level: number;
    title: string;
    line: number;
}>;
//# sourceMappingURL=markdown.d.ts.map