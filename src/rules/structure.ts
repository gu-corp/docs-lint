import fs from 'fs';
import path from 'path';
import type { LintIssue, I18nConfig, FolderNumberingConfig, RuleSeverity, StandardFileNamesConfig } from '../types.js';

/**
 * G.U.Corp standard folder structure definition
 */
export const STANDARD_FOLDER_STRUCTURE: FolderDefinition[] = [
  // Top-level required folders
  { path: '01-plan', required: true, description: 'Planning & Proposals / 企画・提案', files: ['PROPOSAL.md'], optionalFiles: ['MVP.md', 'ROADMAP.md'] },
  { path: '02-spec', required: true, description: 'Specifications / 仕様書' },
  { path: '03-guide', required: true, description: 'Guides & Manuals (SysOps) / ガイド・マニュアル・運用', optionalFiles: ['OPERATION-GUIDE.md', 'DEPLOYMENT-GUIDE.md'] },
  { path: '04-development', required: true, description: 'Development (DevOps, CI/CD, IaC) / 開発・DevOps', files: ['SETUP.md'], optionalFiles: ['CODING-STANDARDS.md', 'TESTING.md', 'GIT-WORKFLOW.md', 'CI-CD.md'] },
  // Optional folders
  { path: '05-business', required: false, description: 'Business Strategy (optional) / ビジネス戦略' },
  { path: '06-reference', required: false, description: 'Research & References (optional) / リサーチ・参考資料' },
  // 02-spec subfolders
  { path: '02-spec/01-requirements', required: true, description: 'Requirements / 要件定義', files: ['REQUIREMENTS.md'] },
  { path: '02-spec/02-architecture', required: true, description: 'Architecture / アーキテクチャ', optionalFiles: ['ARCHITECTURE.md', 'DATABASE-DESIGN.md', 'API-DESIGN.md', 'SECURITY.md', 'PERFORMANCE.md'] },
  { path: '02-spec/03-specifications', required: true, description: 'Specifications / 仕様書 (screens, API, database)' },
  { path: '02-spec/04-testing', required: true, description: 'Test Specifications / テスト仕様', optionalFiles: ['TEST-CASES.md', 'TEST.md', 'E2E.md'] },
  { path: '02-spec/05-reference', required: false, description: 'Reference / 参照資料' },
];

export interface DocsLanguageConfig {
  commonLanguage: string;
  draftLanguages?: string[];
  teams?: Record<string, string>;
}

export interface FolderStructureConfig {
  /** Expected folder structure with optional descriptions */
  folders: FolderDefinition[];
  /** Whether folder names should be numbered (e.g., 01-plan, 02-spec) */
  numberedFolders: boolean;
  /** Whether files should be in UPPER_CASE.md format */
  upperCaseFiles: boolean;
}

export interface FolderDefinition {
  /** Folder path relative to docs root */
  path: string;
  /** Description of the folder's purpose */
  description?: string;
  /** Whether this folder is required */
  required: boolean;
  /** Required files in this folder (must exist if folder exists) */
  files?: string[];
  /** Optional files - if present, must follow this naming convention */
  optionalFiles?: string[];
}

/**
 * Check folder structure matches expected configuration
 */
export async function checkFolderStructure(
  docsDir: string,
  config: FolderStructureConfig
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

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
 * Check G.U.Corp standard folder structure
 * This enforces the recommended structure for all projects
 */
export async function checkStandardFolderStructure(
  docsDir: string
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

  // Check required folders exist
  for (const folder of STANDARD_FOLDER_STRUCTURE) {
    const folderPath = path.join(docsDir, folder.path);

    if (folder.required) {
      if (!fs.existsSync(folderPath)) {
        issues.push({
          file: folder.path,
          message: `Required folder missing: ${folder.path}`,
          suggestion: `mkdir -p ${folder.path}  # ${folder.description}`,
        });
      }
    }

    // Check expected files in folder (only if folder exists)
    if (folder.files && fs.existsSync(folderPath)) {
      for (const file of folder.files) {
        const filePath = path.join(folderPath, file);
        if (!fs.existsSync(filePath)) {
          issues.push({
            file: `${folder.path}/${file}`,
            message: `Required file missing: ${file}`,
            suggestion: `Create ${file} in ${folder.path}`,
          });
        }
      }
    }
  }

  // Check for non-standard top-level folders
  if (fs.existsSync(docsDir)) {
    const entries = fs.readdirSync(docsDir, { withFileTypes: true });
    const folders = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .filter((name) => !name.startsWith('.') && !name.startsWith('_') && name !== 'translations' && name !== 'drafts');

    const standardFolderNames = STANDARD_FOLDER_STRUCTURE
      .map((f) => f.path.split('/')[0])
      .filter((v, i, a) => a.indexOf(v) === i); // unique

    for (const folder of folders) {
      if (!standardFolderNames.includes(folder)) {
        issues.push({
          file: folder,
          message: `Non-standard folder: ${folder}`,
          suggestion: `Expected: ${standardFolderNames.join(', ')}`,
        });
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
export async function checkFolderNumbering(
  docsDir: string,
  config?: FolderNumberingConfig | RuleSeverity
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

  // Parse config
  const strictPaths =
    config && typeof config === 'object' ? config.strictPaths : ['', '02-spec'];
  const checkSequence =
    config && typeof config === 'object' ? config.checkSequence : true;

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
function checkFolderNumberingAt(
  targetDir: string,
  pathLabel: string,
  checkSequence: boolean
): LintIssue[] {
  const issues: LintIssue[] = [];

  // Get folders in target directory
  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  const folders = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => !name.startsWith('.') && !name.startsWith('_') && name !== 'translations');

  // Check if folders follow numbered pattern
  const numberedPattern = /^(\d{2})-(.+)$/;
  const numberedFolders = folders.filter((f) => numberedPattern.test(f));
  const unnumberedFolders = folders.filter(
    (f) => !numberedPattern.test(f) && f !== 'README.md'
  );

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
      .map((f) => parseInt(f.match(numberedPattern)![1]))
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
export async function checkFileNaming(
  docsDir: string,
  files: string[],
  config: { upperCase: boolean; allowedPatterns?: RegExp[] }
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

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
    } else {
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
export async function checkDuplicateContent(
  docsDir: string,
  files: string[]
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];
  const titles: Map<string, string[]> = new Map();

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
      titles.get(title)!.push(file);
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
export function readDocsLanguageConfig(docsDir: string): DocsLanguageConfig | null {
  const configPath = path.join(docsDir, 'docs.config.json');
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {
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
export async function checkI18nStructure(
  docsDir: string,
  files: string[],
  i18nConfig: I18nConfig | undefined
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

  // If no i18n config, skip this check
  if (!i18nConfig) {
    return issues;
  }

  const {
    sourceLanguage,
    targetLanguages = [],
    translationsFolder = 'translations',
    checkSync = false,
  } = i18nConfig;

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
  const sourceFiles = getAllMarkdownFiles(sourceLangDir).map((f) =>
    path.relative(sourceLangDir, f)
  );

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
      const targetFiles = getAllMarkdownFiles(targetLangDir).map((f) =>
        path.relative(targetLangDir, f)
      );

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
      if (!langFolders.includes(targetLang)) continue;

      const targetLangDir = path.join(translationsDir, targetLang);

      for (const sourceFile of sourceFiles) {
        const sourceFilePath = path.join(sourceLangDir, sourceFile);
        const targetFilePath = path.join(targetLangDir, sourceFile);

        if (!fs.existsSync(targetFilePath)) continue;

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
function extractVersion(content: string): string | null {
  // Match patterns like **バージョン**: 1.0 or **Version**: 1.0
  const versionPattern = /\*\*(?:バージョン|Version)\*\*:\s*(\d+(?:\.\d+)*)/i;
  const match = content.match(versionPattern);
  return match ? match[1] : null;
}

/**
 * Count headings in document
 */
function countHeadings(content: string): { h1: number; h2: number } {
  const lines = content.split('\n');
  let h1 = 0;
  let h2 = 0;
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    if (line.match(/^#\s/)) h1++;
    if (line.match(/^##\s/)) h2++;
  }

  return { h1, h2 };
}

/**
 * Legacy: Check drafts folder structure
 * @deprecated Use checkI18nStructure with language suffix convention instead
 */
export async function checkDraftStructure(
  docsDir: string,
  langConfig: DocsLanguageConfig | null
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];
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
function getAllMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      files.push(...getAllMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Helper: Find a file by name anywhere in docs dir (excluding drafts)
 */
function findFileInDocsDir(docsDir: string, fileName: string): string | null {
  const search = (dir: string): string | null => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip drafts folder
      if (entry.name === 'drafts') continue;

      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const found = search(fullPath);
        if (found) return found;
      } else if (entry.isFile() && entry.name === fileName) {
        return fullPath;
      }
    }

    return null;
  };

  return search(docsDir);
}

/**
 * Check for standard file naming patterns
 * - Warn when *-DETAIL.md files exist (should be split into folders)
 * - Warn when conflicting files exist (e.g., UI.md + SCREEN.md)
 */
export async function checkStandardFileNames(
  docsDir: string,
  files: string[],
  config?: StandardFileNamesConfig | RuleSeverity
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

  // Parse config
  const defaultConfig: StandardFileNamesConfig = {
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
  };

  const cfg: StandardFileNamesConfig =
    config && typeof config === 'object' ? config : defaultConfig;

  // Group files by directory
  const filesByDir = new Map<string, string[]>();
  for (const file of files) {
    const dir = path.dirname(file);
    if (!filesByDir.has(dir)) {
      filesByDir.set(dir, []);
    }
    filesByDir.get(dir)!.push(path.basename(file));
  }

  // Check for *-DETAIL.md patterns
  if (cfg.warnDetailFiles) {
    for (const file of files) {
      const fileName = path.basename(file);
      for (const pattern of cfg.detailPatterns) {
        if (fileName.endsWith(pattern)) {
          const baseName = fileName.replace(pattern, '');
          const suggestedFolder = baseName.toLowerCase() + 's';
          issues.push({
            file,
            message: `${fileName} はフォルダに分割することを推奨します`,
            suggestion: `${path.dirname(file)}/${suggestedFolder}/ フォルダを作成し、個別ファイルに分割してください`,
          });
        }
      }
    }
  }

  // Check for conflicting files in the same directory
  if (cfg.warnConflicts) {
    for (const [dir, dirFiles] of filesByDir) {
      for (const conflict of cfg.conflicts) {
        const foundFiles = conflict.files.filter((f) => dirFiles.includes(f));
        if (foundFiles.length > 1) {
          // Multiple conflicting files found
          for (const foundFile of foundFiles) {
            if (foundFile !== conflict.preferred) {
              issues.push({
                file: path.join(dir, foundFile),
                message: conflict.message,
                suggestion: `${foundFile} の内容を ${conflict.preferred} に統合してください`,
              });
            }
          }
        }
      }
    }
  }

  return issues;
}
