import type { ResolvedDocsLintConfig, StandardSelection } from '../core/types.js';
export interface LoadConfigOptions {
    cwd?: string;
    configPath?: string;
    root?: string;
    /** Disable upward configuration discovery when the caller has already resolved scope. */
    search?: boolean;
}
export declare function loadConfig(options?: LoadConfigOptions): ResolvedDocsLintConfig;
export declare function writeDefaultConfig(targetPath: string, root?: string, standard?: StandardSelection): void;
//# sourceMappingURL=config.d.ts.map