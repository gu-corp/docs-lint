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
 */
export async function checkFolderNumbering(docsDir) {
    const issues = [];
    // Get top-level folders
    const entries = fs.readdirSync(docsDir, { withFileTypes: true });
    const folders = entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .filter((name) => !name.startsWith('.'));
    // Check if folders follow numbered pattern
    const numberedPattern = /^(\d{2})-(.+)$/;
    const numberedFolders = folders.filter((f) => numberedPattern.test(f));
    const unnumberedFolders = folders.filter((f) => !numberedPattern.test(f));
    // If most folders are numbered, flag unnumbered ones
    if (numberedFolders.length > 0 && unnumberedFolders.length > 0) {
        for (const folder of unnumberedFolders) {
            issues.push({
                file: folder,
                message: `Folder not numbered: ${folder}`,
                suggestion: `Rename to follow pattern: XX-${folder}`,
            });
        }
    }
    // Check numbering sequence
    if (numberedFolders.length > 0) {
        const numbers = numberedFolders
            .map((f) => parseInt(f.match(numberedPattern)[1]))
            .sort((a, b) => a - b);
        for (let i = 0; i < numbers.length; i++) {
            const expected = numbers[0] + i;
            if (numbers[i] !== expected) {
                issues.push({
                    file: docsDir,
                    message: `Gap in folder numbering: missing ${String(expected).padStart(2, '0')}-*`,
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
 * Check drafts folder structure and translation sync
 *
 * Expected structure:
 * docs/
 * ├── README.md              # Common language (Single Source of Truth)
 * ├── 01-plan/
 * │   └── PROPOSAL.md        # Common language
 * └── drafts/
 *     ├── ja/                # Japanese team drafts
 *     │   └── PROPOSAL.md
 *     └── vi/                # Vietnamese team drafts
 *         └── PROPOSAL.md
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