import fs from 'fs';
import path from 'path';
import type { LintIssue } from '../types.js';

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
  /** Expected files in this folder */
  files?: string[];
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
 * Check folder numbering consistency (01-, 02-, etc.)
 */
export async function checkFolderNumbering(
  docsDir: string
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

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
      .map((f) => parseInt(f.match(numberedPattern)![1]))
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
