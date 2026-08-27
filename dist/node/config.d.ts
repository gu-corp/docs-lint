import type { ResolvedDocsLintConfig, StandardSelection } from '../core/types.js';
export interface LoadConfigOptions {
    cwd?: string;
    configPath?: string;
    root?: string;
}
export declare function loadConfig(options?: LoadConfigOptions): ResolvedDocsLintConfig;
export declare function writeDefaultConfig(targetPath: string, root?: string, standard?: StandardSelection): void;
//# sourceMappingURL=config.d.ts.map