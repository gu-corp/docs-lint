import type { DocumentFile, LintReport, ResolvedDocsLintConfig, RuleDefinition } from './types.js';
import type { LoadedStandardPack, ResolvedStandardProfile } from '../standards/types.js';
export declare const BUILTIN_RULES: RuleDefinition[];
export interface EngineInput {
    config: ResolvedDocsLintConfig;
    documents: DocumentFile[];
    pathExists(relativePath: string): boolean;
    standardPack?: LoadedStandardPack;
    standardProfile?: ResolvedStandardProfile;
    only?: string[];
    skip?: string[];
}
export declare class DocsLintEngine {
    private readonly rules;
    constructor(rules?: RuleDefinition[]);
    register(rule: RuleDefinition): void;
    availableRules(): RuleDefinition[];
    lint(input: EngineInput): Promise<LintReport>;
}
//# sourceMappingURL=engine.d.ts.map