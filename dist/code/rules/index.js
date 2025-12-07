import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
/**
 * Check if source files have corresponding test files
 */
export async function checkTestFileExists(srcDir, sourceFiles, testFiles, config) {
    const issues = [];
    const exempt = typeof config === 'object' ? config.exempt : ['**/index.ts', '**/types.ts'];
    // Filter out exempt files
    const filesToCheck = sourceFiles.filter((file) => {
        return !exempt.some((pattern) => {
            if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
                return regex.test(file);
            }
            return file.includes(pattern);
        });
    });
    // Create a map of test files for quick lookup
    const testFileMap = new Set();
    for (const testFile of testFiles) {
        // Extract the base name without .test.ts or .spec.ts
        const baseName = testFile
            .replace(/\.test\.(ts|tsx|js|jsx)$/, '')
            .replace(/\.spec\.(ts|tsx|js|jsx)$/, '');
        testFileMap.add(baseName);
    }
    // Check each source file
    for (const sourceFile of filesToCheck) {
        const baseName = sourceFile.replace(/\.(ts|tsx|js|jsx)$/, '');
        // Check various test file naming conventions
        const possibleTestPaths = [
            baseName,
            baseName.replace('src/', 'tests/'),
            baseName.replace('src/', 'tests/unit/'),
            baseName.replace(/^(.*)\/([^/]+)$/, '$1/__tests__/$2'),
        ];
        const hasTest = possibleTestPaths.some((p) => testFileMap.has(p));
        if (!hasTest) {
            issues.push({
                file: sourceFile,
                message: `No test file found`,
                suggestion: `Create a test file like ${baseName}.test.ts`,
            });
        }
    }
    return issues;
}
/**
 * Check test type coverage (unit, integration, E2E)
 */
export async function checkTestTypeCoverage(srcDir, sourceFiles, testPatterns, testDirs, config) {
    const issues = [];
    const requireUnit = typeof config === 'object' ? config.requireUnit : true;
    const requireIntegration = typeof config === 'object' ? config.requireIntegration : true;
    // Find test files by type
    const allTestDirs = [...testDirs, srcDir];
    let unitTests = [];
    let integrationTests = [];
    for (const dir of allTestDirs) {
        const resolvedDir = path.resolve(dir);
        if (!fs.existsSync(resolvedDir))
            continue;
        try {
            const unitFiles = await glob(testPatterns.unit, { cwd: resolvedDir });
            unitTests.push(...unitFiles.map((f) => path.join(dir, f)));
            const integrationFiles = await glob(testPatterns.integration, { cwd: resolvedDir });
            integrationTests.push(...integrationFiles.map((f) => path.join(dir, f)));
        }
        catch {
            // Directory might not exist
        }
    }
    // Check lib/ files have unit tests
    if (requireUnit) {
        const libFiles = sourceFiles.filter((f) => f.includes('/lib/') || f.includes('/utils/'));
        for (const libFile of libFiles) {
            const baseName = path.basename(libFile, path.extname(libFile));
            const hasUnitTest = unitTests.some((t) => t.includes(baseName));
            if (!hasUnitTest) {
                issues.push({
                    file: libFile,
                    message: `Library file missing unit test`,
                    suggestion: `Add unit test in tests/unit/ or src/__tests__/`,
                });
            }
        }
    }
    // Check api/ files have integration tests
    if (requireIntegration) {
        const apiFiles = sourceFiles.filter((f) => f.includes('/api/') || f.includes('/services/'));
        for (const apiFile of apiFiles) {
            const baseName = path.basename(apiFile, path.extname(apiFile));
            const hasIntegrationTest = integrationTests.some((t) => t.includes(baseName));
            if (!hasIntegrationTest) {
                issues.push({
                    file: apiFile,
                    message: `API/Service file missing integration test`,
                    suggestion: `Add integration test in tests/integration/`,
                });
            }
        }
    }
    return issues;
}
/**
 * Check critical paths have E2E tests
 */
export async function checkCriticalE2E(srcDir, sourceFiles, e2ePattern, testDirs, criticalPaths) {
    const issues = [];
    // Find E2E test files
    let e2eTests = [];
    for (const dir of testDirs) {
        const resolvedDir = path.resolve(dir);
        if (!fs.existsSync(resolvedDir))
            continue;
        try {
            const e2eFiles = await glob(e2ePattern, { cwd: resolvedDir });
            e2eTests.push(...e2eFiles.map((f) => path.join(dir, f)));
        }
        catch {
            // Directory might not exist
        }
    }
    // Also check tests/e2e directory
    const e2eDir = path.resolve('tests/e2e');
    if (fs.existsSync(e2eDir)) {
        const files = await glob('**/*.spec.ts', { cwd: e2eDir });
        e2eTests.push(...files.map((f) => path.join('tests/e2e', f)));
    }
    // Check each critical path
    for (const criticalPath of criticalPaths) {
        // Find source files matching this critical path
        const matchingFiles = sourceFiles.filter((file) => criticalPath.patterns.some((pattern) => {
            const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
            return regex.test(file);
        }));
        if (matchingFiles.length === 0)
            continue;
        // Check if there are E2E tests covering this path
        const hasE2E = e2eTests.some((test) => {
            const testContent = fs.existsSync(test) ? fs.readFileSync(test, 'utf-8') : '';
            // Check if test file name or content relates to the critical path
            return (test.toLowerCase().includes(criticalPath.name.toLowerCase()) ||
                criticalPath.patterns.some((p) => testContent.includes(p.replace(/\*\*/g, '').replace(/\*/g, ''))));
        });
        if (!hasE2E) {
            issues.push({
                file: criticalPath.patterns.join(', '),
                message: `Critical path "${criticalPath.name}" missing E2E test: ${criticalPath.description}`,
                suggestion: `Add E2E test in tests/e2e/${criticalPath.name}.spec.ts`,
            });
        }
    }
    return issues;
}
//# sourceMappingURL=index.js.map