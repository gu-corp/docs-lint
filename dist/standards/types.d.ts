import type { RuleSetting } from '../contracts/rule-setting.js';
export type LocalizedText = string | Record<string, string>;
export interface StandardPackVariable {
    description?: string;
    required?: boolean;
    default?: string;
}
export interface StandardSectionDefinition {
    id: string;
    title: LocalizedText;
    required?: boolean;
    level?: number;
}
export interface StandardDocumentType {
    title: LocalizedText;
    description?: LocalizedText;
    template: string;
    suggestedPath?: string;
    canonicalLocale?: string;
    variables?: Record<string, StandardPackVariable>;
    sections?: StandardSectionDefinition[];
    tags?: string[];
}
export interface StandardProfile {
    title: LocalizedText;
    description?: LocalizedText;
    extends?: string[];
    documentTypes?: string[];
    requiredDocuments?: string[];
    variables?: Record<string, string>;
    rules?: Record<string, RuleSetting>;
}
export interface StandardFolderDefinition {
    path: string;
    title?: LocalizedText;
    required?: boolean;
}
export interface DocumentStandardPack {
    schemaVersion: 1;
    id: string;
    version: string;
    title: LocalizedText;
    description?: LocalizedText;
    defaultProfile?: string;
    profiles: Record<string, StandardProfile>;
    documentTypes: Record<string, StandardDocumentType>;
    structure?: StandardFolderDefinition[];
    terminology?: Array<{
        preferred: string;
        variants: string[];
        locale?: string;
    }>;
    rules?: Record<string, RuleSetting>;
    ai?: {
        instructions?: string[];
        reviewInstructions?: string[];
    };
}
export interface LoadedStandardPack {
    rootPath: string;
    manifestPath: string;
    manifest: DocumentStandardPack;
}
export interface ResolvedStandardProfile extends StandardProfile {
    id: string;
    inheritance: string[];
}
//# sourceMappingURL=types.d.ts.map