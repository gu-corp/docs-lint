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
        standardFolderStructure: 'error',
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
        requirementTestMapping: {
            severity: 'error',
            requirementPattern: 'FR-([A-Z]+-)*\\d{3}',
            testCasePattern: 'TC-[UIEPSDX]\\d{3}',
            requirementFiles: ['**/REQUIREMENTS.md', '**/01-requirements/**/*.md'],
            testCaseFiles: ['**/TEST-CASES.md', '**/TEST.md', '**/05-testing/**/*.md', '**/*-TESTS.md', '**/DEFERRED-TESTS.md'],
            requiredCoverage: 100,
            requireTestFile: true,
            requireRequirementIds: true,
            requireTestCaseIds: true,
        },
    },
    terminology: [],
    requiredFiles: [],
    requirementPatterns: [],
};
//# sourceMappingURL=types.js.map