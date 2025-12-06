import fs from 'fs';
import path from 'path';
/**
 * Check folder structure matches expected configuration
 */
export async function checkFolderStructure(docsDir, config) {
    const issues = [];
    // Check required folders exist
    for (const folder of config.folders) {
        if (folder.required) {
            const folderPath = path.join(docsDir, folder.path);
            if (!fs.existsSync(folderPath)) {
                issues.push({
                    file: folder.path,
                    message: `Required folder missing: ${folder.path}`,
                    suggestion: folder.description
                        ? `Create folder for: ${folder.description}`
                        : `Create the folder`,
                });
            }
        }
        // Check expected files in folder
        if (folder.files) {
            for (const file of folder.files) {
                const filePath = path.join(docsDir, folder.path, file);
                if (!fs.existsSync(filePath)) {
                    issues.push({
                        file: `${folder.path}/${file}`,
                        message: `Expected file missing`,
                        suggestion: `Create ${file} in ${folder.path}`,
                    });
                }
            }
        }
    }
    return issues;
}
/**
 * Check folder numbering consistency (01-, 02-, etc.)
 *
 * Config example:
 * {
 *   severity: 'warn',
 *   strictPaths: ['', '02-spec'],  // '' = top-level, '02-spec' = 02-spec subfolders
 *   checkSequence: true
 * }
 *
 * Default: Check top-level and 02-spec subfolders (G.U.Corp standard)
 */
export async function checkFolderNumbering(docsDir, config) {
    const issues = [];
    // Parse config
    const strictPaths = config && typeof config === 'object' ? config.strictPaths : ['', '02-spec'];
    const checkSequence = config && typeof config === 'object' ? config.checkSequence : true;
    // Check each strict path
    for (const strictPath of strictPaths) {
        const targetDir = strictPath ? path.join(docsDir, strictPath) : docsDir;
        if (!fs.existsSync(targetDir)) {
            continue;
        }
        const pathLabel = strictPath || '(top-level)';
        const folderIssues = checkFolderNumberingAt(targetDir, pathLabel, checkSequence);
        issues.push(...folderIssues);
    }
    return issues;
}
/**
 * Check folder numbering at a specific path
 */
function checkFolderNumberingAt(targetDir, pathLabel, checkSequence) {
    const issues = [];
    // Get folders in target directory
    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    const folders = entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .filter((name) => !name.startsWith('.') && name !== 'translations');
    // Check if folders follow numbered pattern
    const numberedPattern = /^(\d{2})-(.+)$/;
    const numberedFolders = folders.filter((f) => numberedPattern.test(f));
    const unnumberedFolders = folders.filter((f) => !numberedPattern.test(f) && f !== 'README.md');
    // Flag unnumbered folders in strict paths
    for (const folder of unnumberedFolders) {
        const relativePath = pathLabel === '(top-level)' ? folder : `${pathLabel}/${folder}`;
        issues.push({
            file: relativePath,
            message: `Folder not numbered in ${pathLabel}: ${folder}`,
            suggestion: `Rename to follow pattern: XX-${folder}`,
        });
    }
    // Check numbering sequence
    if (checkSequence && numberedFolders.length > 0) {
        const numbers = numberedFolders
            .map((f) => parseInt(f.match(numberedPattern)[1]))
            .sort((a, b) => a - b);
        for (let i = 0; i < numbers.length; i++) {
            const expected = numbers[0] + i;
            if (numbers[i] !== expected) {
                issues.push({
                    file: pathLabel === '(top-level)' ? '.' : pathLabel,
                    message: `Gap in folder numbering at ${pathLabel}: missing ${String(expected).padStart(2, '0')}-*`,
                    suggestion: `Renumber folders to be sequential`,
                });
                break;
            }
        }
    }
    return issues;
}
/**
 * Check file naming conventions
 */
export async function checkFileNaming(docsDir, files, config) {
    const issues = [];
    const defaultPatterns = [
        /^[A-Z][A-Z0-9-]*\.md$/, // UPPER-CASE.md
        /^README\.md$/, // README.md
        /^CHANGELOG\.md$/, // CHANGELOG.md
        /^[a-z][a-z0-9-]*\.md$/, // lower-case.md (if not strict)
    ];
    const patterns = config.allowedPatterns || defaultPatterns;
    for (const file of files) {
        const fileName = path.basename(file);
        if (config.upperCase) {
            // Strict: must be UPPER_CASE.md or README.md
            const upperCasePattern = /^[A-Z][A-Z0-9-]*\.md$/;
            if (!upperCasePattern.test(fileName) && fileName !== 'README.md') {
                issues.push({
                    file,
                    message: `File name should be UPPER-CASE: ${fileName}`,
                    suggestion: `Rename to ${fileName.toUpperCase()}`,
                });
            }
        }
        else {
            // Check against allowed patterns
            const matchesAny = patterns.some((p) => p.test(fileName));
            if (!matchesAny) {
                issues.push({
                    file,
                    message: `File name doesn't match naming convention: ${fileName}`,
                    suggestion: `Use UPPER-CASE.md or lower-case.md format`,
                });
            }
        }
    }
    return issues;
}
/**
 * Check for duplicate content/titles across documents
 */
export async function checkDuplicateContent(docsDir, files) {
    const issues = [];
    const titles = new Map();
    // Extract titles from all files
    for (const file of files) {
        const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
        const lines = content.split('\n');
        // Get first h1 heading
        const h1Match = lines.find((line) => line.startsWith('# '));
        if (h1Match) {
            const title = h1Match.replace(/^#\s+/, '').trim();
            if (!titles.has(title)) {
                titles.set(title, []);
            }
            titles.get(title).push(file);
        }
    }
    // Find duplicates
    for (const [title, fileList] of titles) {
        if (fileList.length > 1) {
            for (const file of fileList) {
                issues.push({
                    file,
                    message: `Duplicate title "${title}" found in ${fileList.length} files`,
                    suggestion: `Consider consolidating or renaming: ${fileList.join(', ')}`,
                });
            }
        }
    }
    return issues;
}
/**
 * Read docs.config.json for language settings
 */
export function readDocsLanguageConfig(docsDir) {
    const configPath = path.join(docsDir, 'docs.config.json');
    if (fs.existsSync(configPath)) {
        try {
            return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
        catch {
            return null;
        }
    }
    return null;
}
/**
 * Check i18n file structure using translations folder convention
 *
 * Expected folder structure:
 * docs/
 * ├── 01-plan/
 * │   └── PROPOSAL.md              # Source (main location)
 * └── translations/
 *     ├── ja/                       # Source language copy
 *     │   └── 01-plan/
 *     │       └── PROPOSAL.md
 *     └── en/                       # Translation
 *         └── 01-plan/
 *             └── PROPOSAL.md
 *
 * Configuration:
 * {
 *   "i18n": {
 *     "sourceLanguage": "ja",
 *     "targetLanguages": ["en"],
 *     "translationsFolder": "translations"
 *   }
 * }
 */
export async function checkI18nStructure(docsDir, files, i18nConfig) {
    const issues = [];
    // If no i18n config, skip this check
    if (!i18nConfig) {
        return issues;
    }
    const { sourceLanguage, targetLanguages = [], translationsFolder = 'translations', checkSync = false, } = i18nConfig;
    const translationsDir = path.join(docsDir, translationsFolder);
    // If no translations folder, skip
    if (!fs.existsSync(translationsDir)) {
        return issues;
    }
    // Get language folders
    const entries = fs.readdirSync(translationsDir, { withFileTypes: true });
    const langFolders = entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .filter((name) => !name.startsWith('.'));
    // Validate language folder names
    const validLangPattern = /^[a-z]{2}(-[A-Z]{2})?$/;
    for (const folder of langFolders) {
        if (!validLangPattern.test(folder)) {
            issues.push({
                file: `${translationsFolder}/${folder}`,
                message: `Invalid language folder name: ${folder}`,
                suggestion: `Use ISO language code (e.g., en, ja, vi, en-US)`,
            });
        }
    }
    // Check source language folder exists
    if (!langFolders.includes(sourceLanguage)) {
        issues.push({
            file: translationsFolder,
            message: `Source language folder missing: ${sourceLanguage}`,
            suggestion: `Create ${translationsFolder}/${sourceLanguage}/ and copy source files`,
        });
        return issues;
    }
    // Get files in source language folder
    const sourceLangDir = path.join(translationsDir, sourceLanguage);
    const sourceFiles = getAllMarkdownFiles(sourceLangDir).map((f) => path.relative(sourceLangDir, f));
    // Check translation coverage for each target language
    if (checkSync) {
        for (const targetLang of targetLanguages) {
            if (!langFolders.includes(targetLang)) {
                issues.push({
                    file: translationsFolder,
                    message: `Target language folder missing: ${targetLang}`,
                    suggestion: `Create ${translationsFolder}/${targetLang}/`,
                });
                continue;
            }
            const targetLangDir = path.join(translationsDir, targetLang);
            const targetFiles = getAllMarkdownFiles(targetLangDir).map((f) => path.relative(targetLangDir, f));
            // Find missing translations
            for (const sourceFile of sourceFiles) {
                if (!targetFiles.includes(sourceFile)) {
                    issues.push({
                        file: `${translationsFolder}/${sourceLanguage}/${sourceFile}`,
                        message: `Missing ${targetLang} translation`,
                        suggestion: `Create ${translationsFolder}/${targetLang}/${sourceFile}`,
                    });
                }
            }
            // Find orphan translations (translations without source)
            for (const targetFile of targetFiles) {
                if (!sourceFiles.includes(targetFile)) {
                    issues.push({
                        file: `${translationsFolder}/${targetLang}/${targetFile}`,
                        message: `Translation without source file`,
                        suggestion: `Add source file at ${translationsFolder}/${sourceLanguage}/${targetFile}`,
                    });
                }
            }
        }
    }
    // Check source files are synced with main docs
    for (const sourceFile of sourceFiles) {
        const mainFile = path.join(docsDir, sourceFile);
        const translationSourceFile = path.join(sourceLangDir, sourceFile);
        if (fs.existsSync(mainFile)) {
            // Compare if files are in sync (basic check: file size)
            const mainStat = fs.statSync(mainFile);
            const transStat = fs.statSync(translationSourceFile);
            if (mainStat.size !== transStat.size) {
                issues.push({
                    file: `${translationsFolder}/${sourceLanguage}/${sourceFile}`,
                    message: `Source language copy may be out of sync with main docs`,
                    suggestion: `Update from ${sourceFile}`,
                });
            }
        }
    }
    // Check translation integrity (version/structure sync)
    if (checkSync) {
        for (const targetLang of targetLanguages) {
            if (!langFolders.includes(targetLang))
                continue;
            const targetLangDir = path.join(translationsDir, targetLang);
            for (const sourceFile of sourceFiles) {
                const sourceFilePath = path.join(sourceLangDir, sourceFile);
                const targetFilePath = path.join(targetLangDir, sourceFile);
                if (!fs.existsSync(targetFilePath))
                    continue;
                const sourceContent = fs.readFileSync(sourceFilePath, 'utf-8');
                const targetContent = fs.readFileSync(targetFilePath, 'utf-8');
                // Check version info sync
                const sourceVersion = extractVersion(sourceContent);
                const targetVersion = extractVersion(targetContent);
                if (sourceVersion && targetVersion && sourceVersion !== targetVersion) {
                    issues.push({
                        file: `${translationsFolder}/${targetLang}/${sourceFile}`,
                        message: `Version mismatch: source=${sourceVersion}, translation=${targetVersion}`,
                        suggestion: `Update translation to match source version ${sourceVersion}`,
                    });
                }
                // Check heading structure sync (count of H1, H2 headings)
                const sourceHeadings = countHeadings(sourceContent);
                const targetHeadings = countHeadings(targetContent);
                if (sourceHeadings.h1 !== targetHeadings.h1 || sourceHeadings.h2 !== targetHeadings.h2) {
                    issues.push({
                        file: `${translationsFolder}/${targetLang}/${sourceFile}`,
                        message: `Structure mismatch: source has ${sourceHeadings.h1}xH1/${sourceHeadings.h2}xH2, translation has ${targetHeadings.h1}xH1/${targetHeadings.h2}xH2`,
                        suggestion: `Review translation structure to match source`,
                    });
                }
            }
        }
    }
    return issues;
}
/**
 * Extract version info from document content
 */
function extractVersion(content) {
    // Match patterns like **バージョン**: 1.0 or **Version**: 1.0
    const versionPattern = /\*\*(?:バージョン|Version)\*\*:\s*(\d+(?:\.\d+)*)/i;
    const match = content.match(versionPattern);
    return match ? match[1] : null;
}
/**
 * Count headings in document
 */
function countHeadings(content) {
    const lines = content.split('\n');
    let h1 = 0;
    let h2 = 0;
    let inCodeBlock = false;
    for (const line of lines) {
        if (line.trim().startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            continue;
        }
        if (inCodeBlock)
            continue;
        if (line.match(/^#\s/))
            h1++;
        if (line.match(/^##\s/))
            h2++;
    }
    return { h1, h2 };
}
/**
 * Legacy: Check drafts folder structure
 * @deprecated Use checkI18nStructure with language suffix convention instead
 */
export async function checkDraftStructure(docsDir, langConfig) {
    const issues = [];
    const draftsDir = path.join(docsDir, 'drafts');
    // If no drafts folder, skip this check
    if (!fs.existsSync(draftsDir)) {
        return issues;
    }
    // Get draft language folders
    const entries = fs.readdirSync(draftsDir, { withFileTypes: true });
    const langFolders = entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .filter((name) => !name.startsWith('.'));
    // Validate language folder names (should be ISO language codes)
    const validLangPattern = /^[a-z]{2}(-[A-Z]{2})?$/; // e.g., en, ja, en-US
    for (const folder of langFolders) {
        if (!validLangPattern.test(folder)) {
            issues.push({
                file: `drafts/${folder}`,
                message: `Invalid language folder name: ${folder}`,
                suggestion: `Use ISO language code (e.g., en, ja, vi, en-US)`,
            });
        }
    }
    // If langConfig exists, check configured languages have folders
    if (langConfig?.draftLanguages) {
        for (const lang of langConfig.draftLanguages) {
            if (lang !== langConfig.commonLanguage && !langFolders.includes(lang)) {
                issues.push({
                    file: 'drafts',
                    message: `Missing draft folder for configured language: ${lang}`,
                    suggestion: `Create drafts/${lang}/ folder`,
                });
            }
        }
    }
    // Check for orphan drafts (drafts without corresponding common language doc)
    for (const langFolder of langFolders) {
        const langDraftsDir = path.join(draftsDir, langFolder);
        const draftFiles = getAllMarkdownFiles(langDraftsDir);
        for (const draftFile of draftFiles) {
            // Convert draft path to common language path
            // drafts/ja/PROPOSAL.md -> PROPOSAL.md (or 01-plan/PROPOSAL.md)
            const relativePath = path.relative(langDraftsDir, draftFile);
            const commonPath = path.join(docsDir, relativePath);
            // Also check in numbered folders
            if (!fs.existsSync(commonPath)) {
                // Try to find in any numbered folder
                const fileName = path.basename(relativePath);
                const found = findFileInDocsDir(docsDir, fileName);
                if (!found) {
                    issues.push({
                        file: `drafts/${langFolder}/${relativePath}`,
                        message: `Draft without corresponding common language document`,
                        suggestion: `Create ${relativePath} in docs/ root or publish from draft`,
                    });
                }
            }
        }
    }
    // Check for translation sync markers
    for (const langFolder of langFolders) {
        const langDraftsDir = path.join(draftsDir, langFolder);
        const draftFiles = getAllMarkdownFiles(langDraftsDir);
        for (const draftFile of draftFiles) {
            const content = fs.readFileSync(draftFile, 'utf-8');
            // Check for [Translation pending] markers
            if (content.includes('[Translation pending]') || content.includes('[翻訳保留]')) {
                issues.push({
                    file: path.relative(docsDir, draftFile),
                    message: `Translation pending marker found`,
                    suggestion: `Complete translation and remove marker`,
                });
            }
        }
    }
    return issues;
}
/**
 * Helper: Get all markdown files recursively
 */
function getAllMarkdownFiles(dir) {
    const files = [];
    if (!fs.existsSync(dir))
        return files;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
            files.push(...getAllMarkdownFiles(fullPath));
        }
        else if (entry.isFile() && entry.name.endsWith('.md')) {
            files.push(fullPath);
        }
    }
    return files;
}
/**
 * Helper: Find a file by name anywhere in docs dir (excluding drafts)
 */
function findFileInDocsDir(docsDir, fileName) {
    const search = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            // Skip drafts folder
            if (entry.name === 'drafts')
                continue;
            if (entry.isDirectory() && !entry.name.startsWith('.')) {
                const found = search(fullPath);
                if (found)
                    return found;
            }
            else if (entry.isFile() && entry.name === fileName) {
                return fullPath;
            }
        }
        return null;
    };
    return search(docsDir);
}
//# sourceMappingURL=structure.js.map