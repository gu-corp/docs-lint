import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import type {
  DocsLintConfig,
  LintIssue,
  RuleSeverity,
  LegacyFileNamesConfig,
  VersionInfoConfig,
  RelatedDocumentsConfig,
  StandardsDriftConfig,
} from '../types.js';

/**
 * Helper to check if we're in a code block
 */
function isInCodeBlock(lines: string[], lineIndex: number): boolean {
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
export async function checkBrokenLinks(
  docsDir: string,
  files: string[]
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+\.md)\)/g;

  for (const file of files) {
    const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const linkPath = match[2];
      if (linkPath.startsWith('http')) continue;

      const absolutePath = path.resolve(
        path.dirname(path.join(docsDir, file)),
        linkPath
      );

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
export async function checkLegacyFileNames(
  docsDir: string,
  files: string[],
  config: LegacyFileNamesConfig | RuleSeverity
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

  const pattern =
    typeof config === 'object' ? config.pattern : '\\d{2}-[A-Z][A-Z0-9-]+\\.md';
  const exclude = typeof config === 'object' ? config.exclude : [];
  const legacyPattern = new RegExp(`(${pattern})`, 'g');

  for (const file of files) {
    if (exclude.some((ex) => file.includes(ex))) continue;

    const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, lineNum) => {
      if (isInCodeBlock(lines, lineNum)) return;
      if (line.includes('`')) return;

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
export async function checkVersionInfo(
  docsDir: string,
  files: string[],
  config: VersionInfoConfig | RuleSeverity
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

  const patterns =
    typeof config === 'object'
      ? config.patterns
      : ['**バージョン**:', '**Version**:'];
  const include = typeof config === 'object' ? config.include : files;

  const targetFiles = files.filter((f) =>
    include.some((pattern) => {
      if (pattern.includes('*')) {
        return new RegExp(pattern.replace(/\*/g, '.*')).test(f);
      }
      return f.includes(pattern);
    })
  );

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
export async function checkRelatedDocuments(
  docsDir: string,
  files: string[],
  config: RelatedDocumentsConfig | RuleSeverity
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

  const patterns =
    typeof config === 'object'
      ? config.patterns
      : ['関連ドキュメント', 'Related Documents'];
  const include = typeof config === 'object' ? config.include : files;

  const targetFiles = files.filter((f) =>
    include.some((pattern) => {
      if (pattern.includes('*')) {
        return new RegExp(pattern.replace(/\*/g, '.*')).test(f);
      }
      return f.includes(pattern);
    })
  );

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
export async function checkHeadingHierarchy(
  docsDir: string,
  files: string[]
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

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
      if (inCodeBlock) return;

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
export async function checkTodoComments(
  docsDir: string,
  files: string[]
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];
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
      if (inCodeBlock) return;

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
export async function checkCodeBlockLanguage(
  docsDir: string,
  files: string[]
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

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
export async function checkOrphanDocuments(
  docsDir: string,
  files: string[],
  exclude: string[] = []
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];
  const allReferences = new Set<string>();
  const linkRegex = /\[([^\]]+)\]\(([^)]+\.md)\)/g;

  // Collect all referenced files
  for (const file of files) {
    const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const linkPath = match[2];
      if (!linkPath.startsWith('http')) {
        const absolutePath = path.resolve(
          path.dirname(path.join(docsDir, file)),
          linkPath
        );
        const relativePath = path.relative(docsDir, absolutePath);
        allReferences.add(relativePath);
      }
    }
  }

  // Find orphans
  const defaultExclude = ['README.md', ...exclude];
  const orphans = files.filter((file) => {
    if (defaultExclude.some((ex) => file.includes(ex))) return false;
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
export async function checkTerminology(
  docsDir: string,
  files: string[],
  terminology: { preferred: string; variants: string[] }[]
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

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
          if (inCodeBlock) return;

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
export async function checkBidirectionalRefs(
  docsDir: string,
  files: string[]
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];
  const references: Map<string, Set<string>> = new Map();
  const linkRegex = /\[([^\]]+)\]\(([^)]+\.md)\)/g;

  // Build reference graph
  for (const file of files) {
    const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
    references.set(file, new Set());

    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const linkPath = match[2];
      if (!linkPath.startsWith('http')) {
        const absolutePath = path.resolve(
          path.dirname(path.join(docsDir, file)),
          linkPath
        );
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
export async function checkRequiredFiles(
  docsDir: string,
  requiredFiles: string[]
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

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
export async function checkStandardsDrift(
  docsDir: string,
  templatesDir: string,
  config: StandardsDriftConfig | RuleSeverity
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

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
      } else {
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

// Re-export structure functions
export {
  checkI18nStructure,
  checkDraftStructure,
  checkFolderStructure,
  checkFolderNumbering,
  checkFileNaming,
  checkDuplicateContent,
  readDocsLanguageConfig,
  type DocsLanguageConfig,
  type FolderStructureConfig,
  type FolderDefinition,
} from './structure.js';
