import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import {
  defaultConfig,
  type DocsLintConfig,
  type LintResult,
  type RuleResult,
  type LintIssue,
  type RuleSeverity,
} from './types.js';
import {
  checkBrokenLinks,
  checkLegacyFileNames,
  checkVersionInfo,
  checkRelatedDocuments,
  checkHeadingHierarchy,
  checkTodoComments,
  checkCodeBlockLanguage,
  checkOrphanDocuments,
  checkTerminology,
  checkBidirectionalRefs,
  checkRequiredFiles,
} from './rules/index.js';
import {
  checkFolderStructure,
  checkFolderNumbering,
  checkFileNaming,
  checkDuplicateContent,
  type FolderStructureConfig,
} from './rules/structure.js';

export interface LinterOptions {
  /** Enable verbose output */
  verbose?: boolean;
  /** Only run specific rules */
  only?: string[];
  /** Skip specific rules */
  skip?: string[];
}

/**
 * Main linter class
 */
export class DocsLinter {
  private config: DocsLintConfig;
  private options: LinterOptions;

  constructor(config: DocsLintConfig, options: LinterOptions = {}) {
    this.config = config;
    this.options = options;
  }

  /**
   * Run all enabled rules and return results
   */
  async lint(): Promise<LintResult> {
    const docsDir = path.resolve(this.config.docsDir);

    // Check if docs directory exists
    if (!fs.existsSync(docsDir)) {
      throw new Error(`Documentation directory not found: ${docsDir}`);
    }

    // Get all markdown files
    const files = await this.getFiles(docsDir);

    if (files.length === 0) {
      throw new Error(`No markdown files found in ${docsDir}`);
    }

    // Run all rules
    const ruleResults: RuleResult[] = [];

    // Broken Links
    if (this.shouldRun('brokenLinks')) {
      ruleResults.push(
        await this.runRule('brokenLinks', () => checkBrokenLinks(docsDir, files))
      );
    }

    // Legacy File Names
    if (this.shouldRun('legacyFileNames')) {
      ruleResults.push(
        await this.runRule('legacyFileNames', () =>
          checkLegacyFileNames(docsDir, files, this.config.rules.legacyFileNames)
        )
      );
    }

    // Version Info
    if (this.shouldRun('versionInfo')) {
      ruleResults.push(
        await this.runRule('versionInfo', () =>
          checkVersionInfo(docsDir, files, this.config.rules.versionInfo)
        )
      );
    }

    // Related Documents
    if (this.shouldRun('relatedDocuments')) {
      ruleResults.push(
        await this.runRule('relatedDocuments', () =>
          checkRelatedDocuments(docsDir, files, this.config.rules.relatedDocuments)
        )
      );
    }

    // Heading Hierarchy
    if (this.shouldRun('headingHierarchy')) {
      ruleResults.push(
        await this.runRule('headingHierarchy', () =>
          checkHeadingHierarchy(docsDir, files)
        )
      );
    }

    // TODO Comments
    if (this.shouldRun('todoComments')) {
      ruleResults.push(
        await this.runRule('todoComments', () => checkTodoComments(docsDir, files))
      );
    }

    // Code Block Language
    if (this.shouldRun('codeBlockLanguage')) {
      ruleResults.push(
        await this.runRule('codeBlockLanguage', () =>
          checkCodeBlockLanguage(docsDir, files)
        )
      );
    }

    // Orphan Documents
    if (this.shouldRun('orphanDocuments')) {
      ruleResults.push(
        await this.runRule('orphanDocuments', () =>
          checkOrphanDocuments(docsDir, files, this.config.exclude)
        )
      );
    }

    // Terminology
    if (this.shouldRun('terminology') && this.config.terminology.length > 0) {
      ruleResults.push(
        await this.runRule('terminology', () =>
          checkTerminology(docsDir, files, this.config.terminology)
        )
      );
    }

    // Bidirectional References
    if (this.shouldRun('bidirectionalRefs')) {
      ruleResults.push(
        await this.runRule('bidirectionalRefs', () =>
          checkBidirectionalRefs(docsDir, files)
        )
      );
    }

    // Required Files
    if (this.config.requiredFiles.length > 0) {
      ruleResults.push(
        await this.runRule('requiredFiles', () =>
          checkRequiredFiles(docsDir, this.config.requiredFiles)
        )
      );
    }

    // Calculate summary
    const summary = {
      errors: ruleResults
        .filter((r) => r.severity === 'error')
        .reduce((sum, r) => sum + r.issues.length, 0),
      warnings: ruleResults
        .filter((r) => r.severity === 'warn')
        .reduce((sum, r) => sum + r.issues.length, 0),
      passed: ruleResults.filter((r) => r.passed).length,
    };

    const passed = ruleResults
      .filter((r) => r.severity === 'error')
      .every((r) => r.passed);

    return {
      filesChecked: files.length,
      ruleResults,
      passed,
      summary,
    };
  }

  /**
   * Run folder structure checks
   */
  async lintStructure(structureConfig: FolderStructureConfig): Promise<RuleResult[]> {
    const docsDir = path.resolve(this.config.docsDir);
    const files = await this.getFiles(docsDir);
    const results: RuleResult[] = [];

    // Folder structure
    results.push(
      await this.runRule('folderStructure', () =>
        checkFolderStructure(docsDir, structureConfig)
      )
    );

    // Folder numbering
    if (structureConfig.numberedFolders) {
      results.push(
        await this.runRule('folderNumbering', () => checkFolderNumbering(docsDir))
      );
    }

    // File naming
    results.push(
      await this.runRule('fileNaming', () =>
        checkFileNaming(docsDir, files, { upperCase: structureConfig.upperCaseFiles })
      )
    );

    // Duplicate content
    results.push(
      await this.runRule('duplicateContent', () =>
        checkDuplicateContent(docsDir, files)
      )
    );

    return results;
  }

  /**
   * Get all markdown files matching config patterns
   */
  private async getFiles(docsDir: string): Promise<string[]> {
    const allFiles: string[] = [];

    for (const pattern of this.config.include) {
      const files = await glob(pattern, {
        cwd: docsDir,
        ignore: this.config.exclude,
      });
      allFiles.push(...files);
    }

    // Remove duplicates and sort
    return [...new Set(allFiles)].sort();
  }

  /**
   * Check if a rule should run
   */
  private shouldRun(ruleName: string): boolean {
    // Check if rule is disabled in config
    const severity = this.config.rules[ruleName as keyof typeof this.config.rules];
    if (severity === 'off') return false;

    // Check if rule is in skip list
    if (this.options.skip?.includes(ruleName)) return false;

    // Check if only specific rules should run
    if (this.options.only && !this.options.only.includes(ruleName)) return false;

    return true;
  }

  /**
   * Run a single rule and wrap in RuleResult
   */
  private async runRule(
    ruleName: string,
    fn: () => Promise<LintIssue[]>
  ): Promise<RuleResult> {
    const severity = this.getRuleSeverity(ruleName);

    try {
      const issues = await fn();
      return {
        rule: ruleName,
        severity,
        issues,
        passed: issues.length === 0,
      };
    } catch (error) {
      return {
        rule: ruleName,
        severity,
        issues: [
          {
            file: '',
            message: `Rule error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        passed: false,
      };
    }
  }

  /**
   * Get severity for a rule
   */
  private getRuleSeverity(ruleName: string): RuleSeverity {
    const config = this.config.rules[ruleName as keyof typeof this.config.rules];
    if (typeof config === 'object' && 'severity' in config) {
      return config.severity;
    }
    return (config as RuleSeverity) || 'warn';
  }
}

/**
 * Create a linter with configuration
 */
export function createLinter(
  config: Partial<DocsLintConfig>,
  options?: LinterOptions
): DocsLinter {
  const mergedConfig: DocsLintConfig = {
    ...defaultConfig,
    ...config,
    rules: {
      ...defaultConfig.rules,
      ...config.rules,
    },
  };
  return new DocsLinter(mergedConfig, options);
}
