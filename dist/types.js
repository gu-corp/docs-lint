/**
 * Default configuration
 */
export const defaultConfig = {
    docsDir: './docs',
    include: ['**/*.md'],
    exclude: [],
    rules: {
        brokenLinks: 'error',
        legacyFileNames: 'error',
        versionInfo: 'warn',
        relatedDocuments: 'warn',
        headingHierarchy: 'warn',
        todoComments: 'warn',
        codeBlockLanguage: 'warn',
        orphanDocuments: 'warn',
        terminology: 'warn',
        bidirectionalRefs: 'off',
        requirementsCoverage: 'warn',
        draftStructure: 'warn',
    },
    terminology: [],
    requiredFiles: [],
    requirementPatterns: [],
};
//# sourceMappingURL=types.js.map