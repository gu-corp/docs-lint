import type { LintReport, ResolvedDocsLintConfig } from '../core/types.js';
export interface RunOptions {
    only?: string[];
    skip?: string[];
}
export declare function lintWorkspace(config: ResolvedDocsLintConfig, options?: RunOptions, standard?: {
    standardPack?: import("../index.js").LoadedStandardPack;
    standardProfile?: import("../index.js").ResolvedStandardProfile;
}): Promise<LintReport>;
export declare function relativeDisplayPath(config: ResolvedDocsLintConfig, absolutePath: string): string;
//# sourceMappingURL=run.d.ts.map