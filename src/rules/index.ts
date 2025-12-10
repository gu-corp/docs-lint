import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { lint as markdownlintSync } from 'markdownlint/sync';
import { applyFixes } from 'markdownlint';
import type {
  DocsLintConfig,
  LintIssue,
  RuleSeverity,
  LegacyFileNamesConfig,
  VersionInfoConfig,
  RelatedDocumentsConfig,
  StandardsDriftConfig,
  RequirementTestMappingConfig,
  MarkdownLintConfig,
  TodoCommentsConfig,
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
/** Built-in todo comment tags */
const BUILTIN_TAGS = ['TODO', 'FIXME', 'XXX', 'HACK', 'BUG', 'NOTE', 'REVIEW', 'OPTIMIZE', 'WARNING', 'QUESTION'];

/** Default tag configuration */
const DEFAULT_TAG_CONFIG: Record<string, { severity: 'off' | 'info' | 'warn' | 'error'; message: string }> = {
  TODO: { severity: 'info', message: '実装予定' },
  FIXME: { severity: 'warn', message: '要修正' },
  XXX: { severity: 'warn', message: '要注意' },
  HACK: { severity: 'warn', message: '回避策' },
  BUG: { severity: 'error', message: 'バグ' },
  NOTE: { severity: 'off', message: '補足' },
  REVIEW: { severity: 'info', message: 'レビュー対象' },
  OPTIMIZE: { severity: 'info', message: '最適化候補' },
  WARNING: { severity: 'warn', message: '警告' },
  QUESTION: { severity: 'info', message: '要確認' },
};

/**
 * Check if position is inside inline code (`code`)
 */
function isInInlineCode(line: string, position: number): boolean {
  let inCode = false;
  let i = 0;
  while (i < position && i < line.length) {
    if (line[i] === '`' && (i === 0 || line[i - 1] !== '\\')) {
      // Check for triple backtick (code block start) - not inline
      if (line.substring(i, i + 3) === '```') {
        return false;
      }
      inCode = !inCode;
    }
    i++;
  }
  return inCode;
}

/**
 * Check if line is inside a table
 */
function isTableLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && trimmed.endsWith('|');
}

export async function checkTodoComments(
  docsDir: string,
  files: string[],
  config: TodoCommentsConfig | RuleSeverity
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

  // Parse config
  const isSimpleConfig = typeof config === 'string';
  const baseSeverity = isSimpleConfig ? config : config.severity;

  if (baseSeverity === 'off') {
    return issues;
  }

  const tagConfigs = isSimpleConfig ? DEFAULT_TAG_CONFIG : { ...DEFAULT_TAG_CONFIG };

  // Override with user-specified tag configs
  if (!isSimpleConfig && config.tags) {
    for (const [tag, tagConfig] of Object.entries(config.tags)) {
      if (tagConfig) {
        tagConfigs[tag] = {
          severity: tagConfig.severity,
          message: tagConfig.message || DEFAULT_TAG_CONFIG[tag]?.message || tag,
        };
      }
    }
  }

  // Build tag list
  const customTags = (!isSimpleConfig && config.customTags) || [];
  const allTags = [...BUILTIN_TAGS, ...customTags];

  // Build regex pattern
  const tagPattern = allTags.join('|');
  const todoPattern = new RegExp(`\\b(${tagPattern})[:：]?\\s*(.*)`, 'gi');

  // Options
  const ignoreInlineCode = isSimpleConfig ? true : (config.ignoreInlineCode ?? true);
  const ignoreCodeBlocks = isSimpleConfig ? true : (config.ignoreCodeBlocks ?? true);
  const ignoreInTables = isSimpleConfig ? false : (config.ignoreInTables ?? false);
  const excludePatterns = (!isSimpleConfig && config.excludePatterns) || [];
  const excludeRegexes = excludePatterns.map(p => new RegExp(p, 'i'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
    const lines = content.split('\n');

    let inCodeBlock = false;

    lines.forEach((line, lineNum) => {
      // Track code block state
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return;
      }

      // Skip if in code block and ignoreCodeBlocks is true
      if (inCodeBlock && ignoreCodeBlocks) {
        return;
      }

      // Skip table lines if ignoreInTables is true
      if (ignoreInTables && isTableLine(line)) {
        return;
      }

      // Reset regex lastIndex for each line
      todoPattern.lastIndex = 0;

      let match;
      while ((match = todoPattern.exec(line)) !== null) {
        const tag = match[1].toUpperCase();
        const description = match[2].trim();
        const matchPosition = match.index;

        // Skip if inside inline code
        if (ignoreInlineCode && isInInlineCode(line, matchPosition)) {
          continue;
        }

        // Skip if matches exclude pattern
        const fullMatch = match[0];
        if (excludeRegexes.some(re => re.test(fullMatch))) {
          continue;
        }

        // Get tag config
        const tagConfig = tagConfigs[tag] || { severity: baseSeverity as 'info' | 'warn' | 'error', message: tag };

        // Skip if this tag is turned off
        if (tagConfig.severity === 'off') {
          continue;
        }

        // Build message
        const truncatedDesc = description.length > 50 ? description.substring(0, 50) + '...' : description;
        const messagePrefix = tagConfig.message || tag;

        issues.push({
          file,
          line: lineNum + 1,
          message: `[${tag}] ${messagePrefix}: ${truncatedDesc || '(説明なし)'}`,
          severity: tagConfig.severity,
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

/**
 * Check requirement to test case mapping
 * Ensures all functional requirements have corresponding test cases
 */
export async function checkRequirementTestMapping(
  docsDir: string,
  files: string[],
  config: RequirementTestMappingConfig | RuleSeverity
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

  // Parse config
  const defaultConfig: RequirementTestMappingConfig = {
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

  const cfg: RequirementTestMappingConfig =
    config && typeof config === 'object' ? config : defaultConfig;

  const requirementRegex = new RegExp(cfg.requirementPattern, 'g');
  const testCaseRegex = new RegExp(`(${cfg.testCasePattern}).*?\\[?(${cfg.requirementPattern})\\]?`, 'g');
  const testCaseMentionRegex = new RegExp(`\\[?(${cfg.requirementPattern})\\]?`, 'g');

  // Find requirement files
  const reqFiles: string[] = [];
  for (const pattern of cfg.requirementFiles) {
    const matches = files.filter(f => {
      const globPattern = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
      return new RegExp(globPattern).test(f);
    });
    reqFiles.push(...matches);
  }

  // Find test case files
  const testFiles: string[] = [];
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
  const requirements = new Map<string, { file: string; line: number; description: string }>();
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
  const coveredRequirements = new Set<string>();
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
  const uncoveredRequirements: string[] = [];
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

/**
 * Check markdown formatting using markdownlint
 */
export async function checkMarkdownLint(
  docsDir: string,
  files: string[],
  config: MarkdownLintConfig | RuleSeverity
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

  // Default markdownlint config optimized for documentation
  const defaultRules: Record<string, boolean | Record<string, unknown>> = {
    // Headings
    'MD001': true,  // heading-increment
    'MD003': { style: 'atx' },  // heading-style
    'MD018': true,  // no-missing-space-atx
    'MD019': true,  // no-multiple-space-atx
    'MD022': true,  // blanks-around-headings
    'MD023': true,  // heading-start-left
    'MD024': false, // no-duplicate-heading (allow same headings in different sections)
    'MD025': true,  // single-h1
    'MD041': true,  // first-line-heading

    // Lists
    'MD004': { style: 'dash' },  // ul-style
    'MD005': true,  // list-indent
    'MD007': { indent: 2 },  // ul-indent
    'MD030': true,  // list-marker-space
    'MD032': true,  // blanks-around-lists

    // Code blocks
    'MD014': false, // commands-show-output (allow $ in code blocks)
    'MD031': true,  // blanks-around-fences
    'MD040': true,  // fenced-code-language
    'MD046': { style: 'fenced' },  // code-block-style
    'MD048': { style: 'backtick' },  // code-fence-style

    // Whitespace
    'MD009': true,  // no-trailing-spaces
    'MD010': true,  // no-hard-tabs
    'MD012': true,  // no-multiple-blanks
    'MD047': true,  // single-trailing-newline

    // Links
    'MD011': true,  // no-reversed-links
    'MD034': true,  // no-bare-urls
    'MD042': true,  // no-empty-links

    // Line length - disabled for documentation (tables, etc.)
    'MD013': false,

    // Inline HTML - allow for special cases
    'MD033': false,

    // Emphasis
    'MD036': false, // no-emphasis-as-heading (allow **bold** headings in tables)
    'MD037': true,  // no-space-in-emphasis
    'MD038': true,  // no-space-in-code
    'MD039': true,  // no-space-in-links

    // Tables
    'MD055': false, // table-pipe-style (allow flexible pipe alignment)
    'MD056': false, // table-column-count (allow flexible columns)
    'MD058': false, // blanks-around-tables (allow compact tables)
    'MD060': false, // table-column-style (don't require alignment markers)

    // Other
    'MD026': { punctuation: '.,;:!?' },  // no-trailing-punctuation
    'MD027': true,  // no-multiple-space-blockquote
    'MD028': true,  // no-blanks-blockquote
    'MD029': { style: 'ordered' },  // ol-prefix
    'MD035': { style: '---' },  // hr-style
    'MD044': false, // proper-names (too strict)
    'MD045': false, // no-alt-text (images without alt OK in docs)
    'MD049': { style: 'asterisk' },  // emphasis-style
    'MD050': { style: 'asterisk' },  // strong-style
  };

  // Merge with user config
  const userRules = typeof config === 'object' && config.rules ? config.rules : {};
  const mergedRules = { ...defaultRules, ...userRules };

  // Get absolute paths
  const absolutePaths = files.map(f => path.join(docsDir, f));

  // Run markdownlint
  const results = markdownlintSync({
    files: absolutePaths,
    config: mergedRules,
  });

  // Convert results to LintIssue format
  for (const file of absolutePaths) {
    const fileResults = results[file];
    if (fileResults && fileResults.length > 0) {
      const relativePath = path.relative(docsDir, file);
      for (const result of fileResults) {
        issues.push({
          file: relativePath,
          line: result.lineNumber,
          message: `[${result.ruleNames.join('/')}] ${result.ruleDescription}`,
          suggestion: result.errorDetail || result.fixInfo?.editColumn
            ? `Fix at column ${result.fixInfo?.editColumn}`
            : undefined,
        });
      }
    }
  }

  return issues;
}

/**
 * Fix markdown formatting issues using markdownlint
 * Returns the number of files fixed
 */
export async function fixMarkdownLint(
  docsDir: string,
  files: string[],
  config: MarkdownLintConfig | RuleSeverity
): Promise<{ fixed: number; errors: string[] }> {
  let fixed = 0;
  const errors: string[] = [];

  // Default markdownlint config (same as checkMarkdownLint)
  const defaultRules: Record<string, boolean | Record<string, unknown>> = {
    'MD001': true, 'MD003': { style: 'atx' }, 'MD018': true, 'MD019': true,
    'MD022': true, 'MD023': true, 'MD024': false, 'MD025': true, 'MD041': true,
    'MD004': { style: 'dash' }, 'MD005': true, 'MD007': { indent: 2 },
    'MD030': true, 'MD032': true, 'MD014': false, 'MD031': true, 'MD040': true,
    'MD046': { style: 'fenced' }, 'MD048': { style: 'backtick' },
    'MD009': true, 'MD010': true, 'MD012': true, 'MD047': true,
    'MD011': true, 'MD034': true, 'MD042': true, 'MD013': false,
    'MD033': false, 'MD036': false, 'MD037': true, 'MD038': true, 'MD039': true,
    'MD055': false, 'MD056': false, 'MD058': false, 'MD060': false, // Tables
    'MD026': { punctuation: '.,;:!?' }, 'MD027': true, 'MD028': true,
    'MD029': { style: 'ordered' }, 'MD035': { style: '---' },
    'MD044': false, 'MD045': false,
    'MD049': { style: 'asterisk' }, 'MD050': { style: 'asterisk' },
  };

  const userRules = typeof config === 'object' && config.rules ? config.rules : {};
  const mergedRules = { ...defaultRules, ...userRules };

  for (const file of files) {
    const filePath = path.join(docsDir, file);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      const results = markdownlintSync({
        strings: { [filePath]: content },
        config: mergedRules,
      });

      const fileErrors = results[filePath];
      if (fileErrors && fileErrors.length > 0) {
        // Check if any errors have fixInfo
        const fixableErrors = fileErrors.filter(e => e.fixInfo);
        if (fixableErrors.length > 0) {
          const fixedContent = applyFixes(content, fixableErrors);
          if (fixedContent !== content) {
            fs.writeFileSync(filePath, fixedContent, 'utf-8');
            fixed++;
          }
        }
      }
    } catch (error) {
      errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { fixed, errors };
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
