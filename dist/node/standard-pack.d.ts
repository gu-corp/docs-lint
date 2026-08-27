import type { ResolvedDocsLintConfig } from '../core/types.js';
import type { LoadedStandardPack, ResolvedStandardProfile } from '../standards/types.js';
export declare function loadConfiguredStandard(config: ResolvedDocsLintConfig): {
    standardPack?: LoadedStandardPack;
    standardProfile?: ResolvedStandardProfile;
};
export declare function loadStandardPack(source: string): LoadedStandardPack;
export declare function renderTemplate(pack: LoadedStandardPack, profile: ResolvedStandardProfile, documentTypeId: string, supplied?: Record<string, string>): string;
export declare function bundledPacksRoot(): string;
export declare function listBundledPacks(): LoadedStandardPack[];
//# sourceMappingURL=standard-pack.d.ts.map