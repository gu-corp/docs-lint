import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import {
  defaultConfig,
  type SpecCheckerConfig,
  type CheckResult,
  type RuleResult,
  type CheckIssue,
  type RuleSeverity,
} from './types.js';
import {
  checkTestFileExists,
  checkTestTypeCoverage,
  checkCriticalE2E,
} from './rules/index.js';

export interface CheckerOptions {
  /** Enable verbose output */
  verbose?: boolean;
  /** Only run specific rules */
  only?: string[];
  /** Skip specific rules */
  skip?: string[];
}

/**
 * Main checker class
 */
export class SpecChecker {
  private config: SpecCheckerConfig;
  private options: CheckerOptions;

  constructor(config: SpecCheckerConfig, options: CheckerOptions = {}) {
    this.config = config;
    this.options = options;
  }

  /**
   * Run all enabled rules and return results
   */
  async check(): Promise<CheckResult> {
    const srcDir = path.resolve(this.config.srcDir);

    // Check if src directory exists
    if (!fs.existsSync(srcDir)) {
      throw new Error(`Source directory not found: ${srcDir}`);
    }

    // Get all source files
    const sourceFiles = await this.getSourceFiles(srcDir);

    if (sourceFiles.length === 0) {
      throw new Error(`No source files found in ${srcDir}`);
    }

    // Get all test files
    const testFiles = await this.getTestFiles();

    // Run all rules
    const ruleResults: RuleResult[] = [];

    // Test File Exists
    if (this.shouldRun('testFileExists')) {
      ruleResults.push(
        await this.runRule('testFileExists', () =>
          checkTestFileExists(srcDir, sourceFiles, testFiles, this.config.rules.testFileExists)
        )
      );
    }

    // Test Type Coverage
    if (this.shouldRun('testTypeCoverage')) {
      ruleResults.push(
        await this.runRule('testTypeCoverage', () =>
          checkTestTypeCoverage(
            srcDir,
            sourceFiles,
            this.config.testPatterns,
            this.config.testDirs,
            this.config.rules.testTypeCoverage
          )
        )
      );
    }

    // Critical E2E
    if (this.shouldRun('criticalE2E') && this.config.criticalPaths.length > 0) {
      ruleResults.push(
        await this.runRule('criticalE2E', () =>
          checkCriticalE2E(
            srcDir,
            sourceFiles,
            this.config.testPatterns.e2e,
            this.config.testDirs,
            this.config.criticalPaths
          )
        )
      );
    }

    // Calculate coverage
    const testedFiles = sourceFiles.filter((file) => {
      const baseName = file.replace(/\.(ts|tsx|js|jsx)$/, '');
      return testFiles.some((test) => test.includes(baseName.split('/').pop() || ''));
    });

    // Calculate summary
    const summary = {
      errors: ruleResults
        .filter((r) => r.severity === 'error')
        .reduce((sum, r) => sum + r.issues.length, 0),
      warnings: ruleResults
        .filter((r) => r.severity === 'warn')
        .reduce((sum, r) => sum + r.issues.length, 0),
      passed: ruleResults.filter((r) => r.passed).length,
      coverage: {
        sourceFiles: sourceFiles.length,
        testedFiles: testedFiles.length,
        percentage: Math.round((testedFiles.length / sourceFiles.length) * 100),
      },
    };

    const passed = ruleResults
      .filter((r) => r.severity === 'error')
      .every((r) => r.passed);

    return {
      sourceFilesChecked: sourceFiles.length,
      testFilesFound: testFiles.length,
      ruleResults,
      passed,
      summary,
    };
  }

  /**
   * Get all source files matching config patterns
   */
  private async getSourceFiles(srcDir: string): Promise<string[]> {
    const allFiles: string[] = [];

    for (const pattern of this.config.sourcePatterns) {
      const files = await glob(pattern, {
        cwd: srcDir,
        ignore: this.config.exclude,
      });
      allFiles.push(...files);
    }

    // Remove duplicates and sort
    return [...new Set(allFiles)].sort();
  }

  /**
   * Get all test files
   */
  private async getTestFiles(): Promise<string[]> {
    const allFiles: string[] = [];

    // Search in test directories
    for (const dir of this.config.testDirs) {
      const resolvedDir = path.resolve(dir);
      if (!fs.existsSync(resolvedDir)) continue;

      for (const pattern of Object.values(this.config.testPatterns)) {
        try {
          const files = await glob(pattern, { cwd: resolvedDir });
          allFiles.push(...files.map((f) => path.join(dir, f)));
        } catch {
          // Directory might not exist
        }
      }
    }

    // Also search in src directory for co-located tests
    const srcDir = path.resolve(this.config.srcDir);
    for (const pattern of Object.values(this.config.testPatterns)) {
      try {
        const files = await glob(pattern, { cwd: srcDir });
        allFiles.push(...files.map((f) => path.join(this.config.srcDir, f)));
      } catch {
        // Directory might not exist
      }
    }

    return [...new Set(allFiles)].sort();
  }

  /**
   * Check if a rule should run
   */
  private shouldRun(ruleName: string): boolean {
    // Check if rule is disabled in config
    const severity = this.config.rules[ruleName as keyof typeof this.config.rules];
    if (severity === 'off') return false;
    if (typeof severity === 'object' && severity.severity === 'off') return false;

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
    fn: () => Promise<CheckIssue[]>
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
 * Create a checker with configuration
 */
export function createChecker(
  config: Partial<SpecCheckerConfig>,
  options?: CheckerOptions
): SpecChecker {
  const mergedConfig: SpecCheckerConfig = {
    ...defaultConfig,
    ...config,
    rules: {
      ...defaultConfig.rules,
      ...config.rules,
    },
  };
  return new SpecChecker(mergedConfig, options);
}
