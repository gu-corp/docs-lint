import fs from 'fs';
import path from 'path';
/**
 * Helper to check if we're in a code block
 */
function isInCodeBlock(lines, lineIndex) {
    let inCodeBlock = false;
    for (let i = 0; i < lineIndex; i++) {
        if (lines[i].trim().startsWith('```')) {
            inCodeBlock = !inCodeBlock;
        }
    }
    return inCodeBlock;
}
/**
 * Check for broken markdown links
 */
export async function checkBrokenLinks(docsDir, files) {
    const issues = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+\.md)\)/g;
    for (const file of files) {
        const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            const linkPath = match[2];
            if (linkPath.startsWith('http'))
                continue;
            const absolutePath = path.resolve(path.dirname(path.join(docsDir, file)), linkPath);
            if (!fs.existsSync(absolutePath)) {
                issues.push({
                    file,
                    message: `Broken link to "${linkPath}"`,
                    suggestion: `Verify the file exists or update the link`,
                });
            }
        }
    }
    return issues;
}
/**
 * Check for legacy file name patterns
 */
export async function checkLegacyFileNames(docsDir, files, config) {
    const issues = [];
    const pattern = typeof config === 'object' ? config.pattern : '\\d{2}-[A-Z][A-Z0-9-]+\\.md';
    const exclude = typeof config === 'object' ? config.exclude : [];
    const legacyPattern = new RegExp(`(${pattern})`, 'g');
    for (const file of files) {
        if (exclude.some((ex) => file.includes(ex)))
            continue;
        const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, lineNum) => {
            if (isInCodeBlock(lines, lineNum))
                return;
            if (line.includes('`'))
                return;
            let match;
            while ((match = legacyPattern.exec(line)) !== null) {
                issues.push({
                    file,
                    line: lineNum + 1,
                    message: `Legacy file reference "${match[0]}"`,
                    suggestion: `Update to new file naming convention`,
                });
            }
        });
    }
    return issues;
}
/**
 * Check for version info in documents
 */
export async function checkVersionInfo(docsDir, files, config) {
    const issues = [];
    const patterns = typeof config === 'object'
        ? config.patterns
        : ['**バージョン**:', '**Version**:'];
    const include = typeof config === 'object' ? config.include : files;
    const targetFiles = files.filter((f) => include.some((pattern) => {
        if (pattern.includes('*')) {
            return new RegExp(pattern.replace(/\*/g, '.*')).test(f);
        }
        return f.includes(pattern);
    }));
    for (const file of targetFiles) {
        const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
        const hasVersionInfo = patterns.some((p) => content.includes(p));
        if (!hasVersionInfo) {
            issues.push({
                file,
                message: `Missing version info`,
                suggestion: `Add "**バージョン**: X.X" or "**Version**: X.X" at the top`,
            });
        }
    }
    return issues;
}
/**
 * Check for related documents section
 */
export async function checkRelatedDocuments(docsDir, files, config) {
    const issues = [];
    const patterns = typeof config === 'object'
        ? config.patterns
        : ['関連ドキュメント', 'Related Documents'];
    const include = typeof config === 'object' ? config.include : files;
    const targetFiles = files.filter((f) => include.some((pattern) => {
        if (pattern.includes('*')) {
            return new RegExp(pattern.replace(/\*/g, '.*')).test(f);
        }
        return f.includes(pattern);
    }));
    for (const file of targetFiles) {
        const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
        const hasRelatedDocs = patterns.some((p) => content.includes(p));
        if (!hasRelatedDocs) {
            issues.push({
                file,
                message: `Missing related documents section`,
                suggestion: `Add a "関連ドキュメント" or "Related Documents" section`,
            });
        }
    }
    return issues;
}
/**
 * Check heading hierarchy
 */
export async function checkHeadingHierarchy(docsDir, files) {
    const issues = [];
    for (const file of files) {
        const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
        const lines = content.split('\n');
        let lastLevel = 0;
        let inCodeBlock = false;
        lines.forEach((line, lineNum) => {
            if (line.trim().startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                return;
            }
            if (inCodeBlock)
                return;
            const headingMatch = line.match(/^(#{1,6})\s/);
            if (headingMatch) {
                const level = headingMatch[1].length;
                if (lastLevel === 0) {
                    lastLevel = level;
                    return;
                }
                if (level > lastLevel + 1) {
                    issues.push({
                        file,
                        line: lineNum + 1,
                        message: `Heading jumps from h${lastLevel} to h${level}`,
                        suggestion: `Use h${lastLevel + 1} instead`,
                    });
                }
                lastLevel = level;
            }
        });
    }
    return issues;
}
/**
 * Check for TODO/FIXME comments
 */
export async function checkTodoComments(docsDir, files) {
    const issues = [];
    const todoPattern = /\b(TODO|FIXME|XXX|HACK|BUG)[:：]?\s*(.+)/gi;
    for (const file of files) {
        const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
        const lines = content.split('\n');
        let inCodeBlock = false;
        lines.forEach((line, lineNum) => {
            if (line.trim().startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                return;
            }
            if (inCodeBlock)
                return;
            let match;
            while ((match = todoPattern.exec(line)) !== null) {
                issues.push({
                    file,
                    line: lineNum + 1,
                    message: `Unresolved ${match[1]}: ${match[2].substring(0, 50)}`,
                });
            }
        });
    }
    return issues;
}
/**
 * Check for code block language specifiers
 */
export async function checkCodeBlockLanguage(docsDir, files) {
    const issues = [];
    for (const file of files) {
        const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, lineNum) => {
            if (line.trim() === '```') {
                const nextLine = lines[lineNum + 1];
                if (nextLine && nextLine.trim() !== '') {
                    issues.push({
                        file,
                        line: lineNum + 1,
                        message: `Code block without language specifier`,
                        suggestion: `Add language (e.g., \`\`\`typescript, \`\`\`bash)`,
                    });
                }
            }
        });
    }
    return issues;
}
/**
 * Check for orphan documents
 */
export async function checkOrphanDocuments(docsDir, files, exclude = []) {
    const issues = [];
    const allReferences = new Set();
    const linkRegex = /\[([^\]]+)\]\(([^)]+\.md)\)/g;
    // Collect all referenced files
    for (const file of files) {
        const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            const linkPath = match[2];
            if (!linkPath.startsWith('http')) {
                const absolutePath = path.resolve(path.dirname(path.join(docsDir, file)), linkPath);
                const relativePath = path.relative(docsDir, absolutePath);
                allReferences.add(relativePath);
            }
        }
    }
    // Find orphans
    const defaultExclude = ['README.md', ...exclude];
    const orphans = files.filter((file) => {
        if (defaultExclude.some((ex) => file.includes(ex)))
            return false;
        return !allReferences.has(file);
    });
    for (const orphan of orphans) {
        issues.push({
            file: orphan,
            message: `Document not referenced anywhere`,
            suggestion: `Add a link from another document or README.md`,
        });
    }
    return issues;
}
/**
 * Check terminology consistency
 */
export async function checkTerminology(docsDir, files, terminology) {
    const issues = [];
    for (const file of files) {
        const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
        const lines = content.split('\n');
        for (const { preferred, variants } of terminology) {
            for (const variant of variants) {
                let inCodeBlock = false;
                lines.forEach((line, lineNum) => {
                    if (line.trim().startsWith('```')) {
                        inCodeBlock = !inCodeBlock;
                        return;
                    }
                    if (inCodeBlock)
                        return;
                    if (line.includes(variant)) {
                        issues.push({
                            file,
                            line: lineNum + 1,
                            message: `"${variant}" should be "${preferred}"`,
                            suggestion: `Replace with "${preferred}"`,
                        });
                    }
                });
            }
        }
    }
    return issues;
}
/**
 * Check bidirectional references
 */
export async function checkBidirectionalRefs(docsDir, files) {
    const issues = [];
    const references = new Map();
    const linkRegex = /\[([^\]]+)\]\(([^)]+\.md)\)/g;
    // Build reference graph
    for (const file of files) {
        const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
        references.set(file, new Set());
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            const linkPath = match[2];
            if (!linkPath.startsWith('http')) {
                const absolutePath = path.resolve(path.dirname(path.join(docsDir, file)), linkPath);
                const relativePath = path.relative(docsDir, absolutePath);
                if (files.includes(relativePath)) {
                    references.get(file)?.add(relativePath);
                }
            }
        }
    }
    // Check for missing back-references
    for (const [file, refs] of references) {
        for (const ref of refs) {
            const backRefs = references.get(ref);
            if (backRefs && !backRefs.has(file)) {
                issues.push({
                    file,
                    message: `References "${ref}" but no back-reference exists`,
                    suggestion: `Add a link back from "${ref}"`,
                });
            }
        }
    }
    return issues;
}
/**
 * Check required files exist
 */
export async function checkRequiredFiles(docsDir, requiredFiles) {
    const issues = [];
    for (const file of requiredFiles) {
        const filePath = path.join(docsDir, file);
        if (!fs.existsSync(filePath)) {
            issues.push({
                file,
                message: `Required file missing`,
                suggestion: `Create the file at ${file}`,
            });
        }
    }
    return issues;
}
/**
 * Check if development standards files match templates
 */
export async function checkStandardsDrift(docsDir, templatesDir, config) {
    const issues = [];
    const categories = typeof config === 'object' ? config.categories : ['04-development'];
    const reportMissing = typeof config === 'object' ? config.reportMissing : true;
    const reportDifferent = typeof config === 'object' ? config.reportDifferent : true;
    for (const category of categories) {
        const templateCategoryPath = path.join(templatesDir, category);
        const docsCategoryPath = path.join(docsDir, category);
        // Skip if template category doesn't exist
        if (!fs.existsSync(templateCategoryPath)) {
            continue;
        }
        // Get template files
        const templateFiles = fs.readdirSync(templateCategoryPath).filter(f => f.endsWith('.md'));
        for (const file of templateFiles) {
            const templatePath = path.join(templateCategoryPath, file);
            const docsPath = path.join(docsCategoryPath, file);
            const relativePath = path.join(category, file);
            if (!fs.existsSync(docsPath)) {
                // Missing file
                if (reportMissing) {
                    issues.push({
                        file: relativePath,
                        message: `Missing standards file from template`,
                        suggestion: `Run "docs-lint sync" to add this file`,
                    });
                }
            }
            else {
                // File exists - check if different
                if (reportDifferent) {
                    const templateContent = fs.readFileSync(templatePath, 'utf-8');
                    const docsContent = fs.readFileSync(docsPath, 'utf-8');
                    if (templateContent !== docsContent) {
                        issues.push({
                            file: relativePath,
                            message: `File differs from template`,
                            suggestion: `Run "docs-lint sync --check" to see differences or "docs-lint sync --force" to update`,
                        });
                    }
                }
            }
        }
    }
    return issues;
}
/**
 * Check requirement to test case mapping
 * Ensures all functional requirements have corresponding test cases
 */
export async function checkRequirementTestMapping(docsDir, files, config) {
    const issues = [];
    // Parse config
    const defaultConfig = {
        severity: 'error',
        requirementPattern: 'FR-\\d{3}',
        testCasePattern: 'TC-[UIEPS]\\d{3}',
        requirementFiles: ['**/REQUIREMENTS.md', '**/01-requirements/**/*.md'],
        testCaseFiles: ['**/TEST-CASES.md', '**/TEST.md', '**/05-testing/**/*.md', '**/*-TESTS.md'],
        requiredCoverage: 100,
        requireTestFile: true,
        requireRequirementIds: true,
        requireTestCaseIds: true,
    };
    const cfg = config && typeof config === 'object' ? config : defaultConfig;
    const requirementRegex = new RegExp(cfg.requirementPattern, 'g');
    const testCaseRegex = new RegExp(`(${cfg.testCasePattern}).*?\\[?(${cfg.requirementPattern})\\]?`, 'g');
    const testCaseMentionRegex = new RegExp(`\\[?(${cfg.requirementPattern})\\]?`, 'g');
    // Find requirement files
    const reqFiles = [];
    for (const pattern of cfg.requirementFiles) {
        const matches = files.filter(f => {
            const globPattern = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
            return new RegExp(globPattern).test(f);
        });
        reqFiles.push(...matches);
    }
    // Find test case files
    const testFiles = [];
    for (const pattern of cfg.testCaseFiles) {
        const matches = files.filter(f => {
            const globPattern = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
            return new RegExp(globPattern).test(f);
        });
        testFiles.push(...matches);
    }
    // Check if test files exist
    if (cfg.requireTestFile && testFiles.length === 0 && reqFiles.length > 0) {
        issues.push({
            file: 'docs',
            message: 'テストケースファイルが見つかりません',
            suggestion: 'TEST-CASES.md または 05-testing/ フォルダにテストケースを作成してください',
        });
    }
    // Check if requirement IDs exist in requirement files
    if (cfg.requireRequirementIds && reqFiles.length > 0) {
        let hasRequirementIds = false;
        for (const file of reqFiles) {
            const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
            if (requirementRegex.test(content)) {
                hasRequirementIds = true;
                break;
            }
            // Reset regex lastIndex
            requirementRegex.lastIndex = 0;
        }
        if (!hasRequirementIds) {
            issues.push({
                file: reqFiles[0],
                message: '要件ID（FR-XXX形式）が見つかりません',
                suggestion: '機能要件には FR-001, FR-002 などのIDを付与してください',
            });
        }
    }
    // Check if test case IDs exist in test files
    const testCaseIdRegex = new RegExp(cfg.testCasePattern, 'g');
    if (cfg.requireTestCaseIds && testFiles.length > 0) {
        let hasTestCaseIds = false;
        for (const file of testFiles) {
            const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
            if (testCaseIdRegex.test(content)) {
                hasTestCaseIds = true;
                break;
            }
            // Reset regex lastIndex
            testCaseIdRegex.lastIndex = 0;
        }
        if (!hasTestCaseIds) {
            issues.push({
                file: testFiles[0],
                message: 'テストケースID（TC-XNNN形式）が見つかりません',
                suggestion: 'テストケースには TC-U001（Unit）, TC-I001（Integration）, TC-E001（E2E）などのIDを付与してください',
            });
        }
    }
    // Extract all requirements
    const requirements = new Map();
    for (const file of reqFiles) {
        const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, lineNum) => {
            let match;
            while ((match = requirementRegex.exec(line)) !== null) {
                const reqId = match[0];
                if (!requirements.has(reqId)) {
                    requirements.set(reqId, {
                        file,
                        line: lineNum + 1,
                        description: line.substring(0, 100),
                    });
                }
            }
        });
    }
    // Extract test case mappings
    const coveredRequirements = new Set();
    for (const file of testFiles) {
        const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line) => {
            // Look for explicit test case to requirement mapping (TC-001 [FR-001])
            let match;
            while ((match = testCaseRegex.exec(line)) !== null) {
                coveredRequirements.add(match[2]);
            }
            // Also look for any requirement mentions
            while ((match = testCaseMentionRegex.exec(line)) !== null) {
                coveredRequirements.add(match[1]);
            }
        });
    }
    // Find uncovered requirements
    const uncoveredRequirements = [];
    for (const [reqId, info] of requirements) {
        if (!coveredRequirements.has(reqId)) {
            uncoveredRequirements.push(reqId);
            issues.push({
                file: info.file,
                line: info.line,
                message: `要件 ${reqId} に対応するテストケースがありません`,
                suggestion: `TEST-CASES.md に ${reqId} をカバーするテストケースを追加してください`,
            });
        }
    }
    // Calculate coverage
    const totalRequirements = requirements.size;
    const coveredCount = totalRequirements - uncoveredRequirements.length;
    const coveragePercent = totalRequirements > 0 ? (coveredCount / totalRequirements) * 100 : 100;
    // Check if coverage meets requirement
    if (totalRequirements > 0 && coveragePercent < cfg.requiredCoverage) {
        issues.push({
            file: 'docs',
            message: `要件カバレッジが ${coveragePercent.toFixed(1)}% です（必要: ${cfg.requiredCoverage}%）`,
            suggestion: `未カバーの要件: ${uncoveredRequirements.join(', ')}`,
        });
    }
    return issues;
}
// Re-export structure functions
export { checkI18nStructure, checkDraftStructure, checkFolderStructure, checkFolderNumbering, checkFileNaming, checkDuplicateContent, readDocsLanguageConfig, } from './structure.js';
//# sourceMappingURL=index.js.map