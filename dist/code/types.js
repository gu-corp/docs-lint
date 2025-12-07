/**
 * Default configuration
 */
export const defaultConfig = {
    srcDir: './src',
    testDirs: ['tests', '__tests__', 'src/**/__tests__'],
    sourcePatterns: ['**/*.ts', '**/*.tsx'],
    testPatterns: {
        unit: '**/*.test.ts',
        integration: '**/integration/**/*.test.ts',
        e2e: '**/*.spec.ts',
    },
    rules: {
        testFileExists: {
            severity: 'warn',
            minCoverage: 70,
            exempt: ['**/index.ts', '**/types.ts', '**/*.d.ts'],
        },
        testTypeCoverage: {
            severity: 'warn',
            requireUnit: true,
            requireIntegration: true,
            requireE2E: true,
        },
        coverageThreshold: {
            severity: 'warn',
            thresholds: {
                utilities: 80,
                businessLogic: 70,
                api: 70,
                ui: 50,
            },
        },
        criticalE2E: 'error',
    },
    exclude: ['node_modules/**', '**/*.d.ts', '**/index.ts'],
    criticalPaths: [
        {
            name: 'authentication',
            description: 'Authentication and authorization flows',
            patterns: ['**/auth/**', '**/login/**', '**/session/**'],
            requiredTestType: 'e2e',
        },
        {
            name: 'payment',
            description: 'Payment and billing processing',
            patterns: ['**/payment/**', '**/billing/**', '**/checkout/**'],
            requiredTestType: 'e2e',
        },
    ],
};
//# sourceMappingURL=types.js.map