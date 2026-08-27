import type { LintReport, Severity } from '../core/types.js';
import type { LocalizedText, StandardPackVariable } from '../standards/types.js';
import { type RunOptions } from './run.js';
export interface NodeDocsLintSessionOptions {
    /** Absolute path, or a path relative to the current process, for the editor workspace. */
    workspaceRoot: string;
    /** Absolute path, or a path relative to workspaceRoot, for the documentation tree. */
    docsRoot: string;
    /** Optional absolute path, or a path relative to workspaceRoot, for an explicit configuration. */
    configPath?: string;
}
export type EffectiveRuleSource = 'config' | 'profile' | 'pack' | 'default';
export interface EffectiveRuleDescription {
    id: string;
    description: string;
    severity: Severity;
    source: EffectiveRuleSource;
    options?: Record<string, unknown>;
}
export interface TemplateDescription {
    id: string;
    title: LocalizedText;
    description?: LocalizedText;
    suggestedPath?: string;
    variables: Record<string, StandardPackVariable>;
}
export interface DocsLintSessionDescription {
    schemaVersion: 1;
    config: {
        source: 'docs-lint' | 'defaults';
        file?: string;
        directory: string;
        root: string;
    };
    standard?: {
        id: string;
        title: LocalizedText;
        description?: LocalizedText;
        version: string;
        source: string;
        profile: {
            id: string;
            title: LocalizedText;
            description?: LocalizedText;
            inheritance: string[];
        };
    };
    rules: EffectiveRuleDescription[];
    templates: TemplateDescription[];
}
export interface NodeDocsLintSession {
    lint(options?: RunOptions): Promise<LintReport>;
    describe(): DocsLintSessionDescription;
    listTemplates(): TemplateDescription[];
    renderTemplate(templateId: string, variables?: Record<string, string>): string;
}
/**
 * Creates the filesystem-backed API used by editor hosts.
 *
 * Configuration is discovered from docsRoot upwards, but never above workspaceRoot.
 * A discovered configuration contributes every setting except its root: the caller's
 * docsRoot is always authoritative for document reads and lint results.
 */
export declare function createNodeDocsLintSession(options: NodeDocsLintSessionOptions): NodeDocsLintSession;
//# sourceMappingURL=editor-session.d.ts.map