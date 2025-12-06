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
        i18nStructure: 'off',
        requiredFiles: 'warn',
        folderStructure: 'warn',
        folderNumbering: 'warn',
        fileNaming: 'warn',
        duplicateContent: 'warn',
    },
    terminology: [],
    requiredFiles: [],
    requirementPatterns: [],
};
//# sourceMappingURL=types.js.map