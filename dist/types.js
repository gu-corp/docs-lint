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
        folderNumbering: {
            severity: 'warn',
            strictPaths: ['', '02-spec'],
            checkSequence: true,
        },
        fileNaming: 'warn',
        duplicateContent: 'warn',
        standardsDrift: {
            severity: 'warn',
            categories: ['04-development'],
            reportMissing: true,
            reportDifferent: true,
        },
        standardFileNames: {
            severity: 'warn',
            warnDetailFiles: true,
            warnConflicts: true,
            conflicts: [
                {
                    files: ['UI.md', 'SCREEN.md'],
                    preferred: 'SCREEN.md',
                    message: 'UI.md と SCREEN.md が両方存在します。SCREEN.md に統合してください',
                },
            ],
            detailPatterns: ['-DETAIL.md', '-DETAILS.md'],
        },
    },
    terminology: [],
    requiredFiles: [],
    requirementPatterns: [],
};
//# sourceMappingURL=types.js.map