import type { DocumentFile, ResolvedDocsLintConfig } from '../core/types.js';
export declare function loadDocuments(config: ResolvedDocsLintConfig): Promise<DocumentFile[]>;
export declare function writeDocument(rootPath: string, relativePath: string, content: string, force?: boolean): string;
export declare function parseFrontMatter(content: string): {
    frontMatter: Record<string, string>;
    body: string;
};
export declare function securePath(rootPath: string, relativePath: string, requireExisting?: boolean): string;
export declare function toPosix(value: string): string;
//# sourceMappingURL=workspace.d.ts.map