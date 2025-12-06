#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { createLinter } from './linter.js';
import { generateAIPrompt, generateJSONSummary } from './ai-prompt.js';
import { defaultConfig, type DocsLintConfig } from './types.js';
import { glob } from 'glob';

const program = new Command();

program
  .name('docs-lint')
  .description('Lint and validate documentation structure and quality')
  .version('1.0.0');

program
  .command('lint')
  .description('Run documentation linting')
  .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
  .option('-c, --config <path>', 'Configuration file path')
  .option('--only <rules>', 'Only run specific rules (comma-separated)')
  .option('--skip <rules>', 'Skip specific rules (comma-separated)')
  .option('-v, --verbose', 'Verbose output')
  .option('--json', 'Output as JSON')
  .option('--ai-prompt', 'Generate AI-friendly assessment prompt')
  .action(async (options) => {
    try {
      const config = loadConfig(options.config, options.docsDir);
      const linter = createLinter(config, {
        verbose: options.verbose,
        only: options.only?.split(','),
        skip: options.skip?.split(','),
      });

      const result = await linter.lint();

      if (options.json) {
        const files = await glob('**/*.md', { cwd: config.docsDir });
        console.log(JSON.stringify(generateJSONSummary(config.docsDir, files, result), null, 2));
        process.exit(result.passed ? 0 : 1);
      }

      if (options.aiPrompt) {
        const files = await glob('**/*.md', { cwd: config.docsDir });
        console.log(generateAIPrompt(config.docsDir, files, result, config));
        process.exit(result.passed ? 0 : 1);
      }

      // Default: human-readable output
      printResults(result, options.verbose);
      process.exit(result.passed ? 0 : 1);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize docs-lint configuration')
  .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
  .action((options) => {
    const configPath = path.join(process.cwd(), 'docs-lint.config.json');
    if (fs.existsSync(configPath)) {
      console.error(chalk.yellow('Configuration file already exists:', configPath));
      process.exit(1);
    }

    const config: Partial<DocsLintConfig> = {
      docsDir: options.docsDir,
      include: ['**/*.md'],
      exclude: ['node_modules/**'],
      rules: defaultConfig.rules,
      terminology: [
        {
          preferred: 'ドキュメント',
          variants: ['文書', 'ドキュメンテーション'],
        },
      ],
      requiredFiles: ['README.md'],
      requirementPatterns: [],
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green('Created configuration file:'), configPath);
  });

program
  .command('check-structure')
  .description('Check folder structure and naming conventions')
  .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
  .option('--numbered', 'Expect numbered folders (01-, 02-, etc.)', false)
  .option('--upper-case', 'Expect UPPER_CASE.md file names', false)
  .action(async (options) => {
    try {
      const config = loadConfig(undefined, options.docsDir);
      const linter = createLinter(config);

      const results = await linter.lintStructure({
        folders: [],
        numberedFolders: options.numbered,
        upperCaseFiles: options.upperCase,
      });

      let hasErrors = false;
      for (const result of results) {
        if (result.issues.length > 0) {
          console.log(chalk.yellow(`\n${result.rule}:`));
          for (const issue of result.issues) {
            console.log(`  ${chalk.gray(issue.file)} ${issue.message}`);
            if (issue.suggestion) {
              console.log(`    ${chalk.blue('→')} ${issue.suggestion}`);
            }
          }
          if (result.severity === 'error') hasErrors = true;
        }
      }

      if (!hasErrors) {
        console.log(chalk.green('\n✓ Structure checks passed'));
      }
      process.exit(hasErrors ? 1 : 0);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Load configuration from file or defaults
 */
function loadConfig(configPath?: string, docsDir?: string): DocsLintConfig {
  let config: Partial<DocsLintConfig> = {};

  // Try to load from specified path or default locations
  const paths = configPath
    ? [configPath]
    : ['docs-lint.config.json', 'docs-lint.config.js', '.docs-lintrc.json'];

  for (const p of paths) {
    const fullPath = path.resolve(process.cwd(), p);
    if (fs.existsSync(fullPath)) {
      if (p.endsWith('.js')) {
        config = require(fullPath);
      } else {
        config = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      }
      break;
    }
  }

  // Override docsDir if specified
  if (docsDir) {
    config.docsDir = docsDir;
  }

  return {
    ...defaultConfig,
    ...config,
    rules: {
      ...defaultConfig.rules,
      ...config.rules,
    },
  };
}

/**
 * Print results in human-readable format
 */
function printResults(
  result: Awaited<ReturnType<typeof createLinter.prototype.lint>>,
  verbose?: boolean
) {
  console.log(chalk.bold('\n📄 Documentation Lint Results\n'));
  console.log(`Files checked: ${result.filesChecked}`);
  console.log(
    `Status: ${result.passed ? chalk.green('PASSED') : chalk.red('FAILED')}\n`
  );

  // Summary
  console.log(chalk.bold('Summary:'));
  console.log(`  ${chalk.red('Errors:')} ${result.summary.errors}`);
  console.log(`  ${chalk.yellow('Warnings:')} ${result.summary.warnings}`);
  console.log(`  ${chalk.green('Passed:')} ${result.summary.passed}\n`);

  // Rule details
  for (const rule of result.ruleResults) {
    const icon = rule.passed ? chalk.green('✓') : rule.severity === 'error' ? chalk.red('✗') : chalk.yellow('⚠');
    const label = rule.severity === 'error' ? chalk.red(rule.rule) : rule.severity === 'warn' ? chalk.yellow(rule.rule) : rule.rule;

    if (rule.issues.length === 0) {
      if (verbose) {
        console.log(`${icon} ${label}`);
      }
    } else {
      console.log(`${icon} ${label} (${rule.issues.length} issues)`);

      if (verbose) {
        for (const issue of rule.issues) {
          const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;
          console.log(`    ${chalk.gray(location)} ${issue.message}`);
          if (issue.suggestion) {
            console.log(`      ${chalk.blue('→')} ${issue.suggestion}`);
          }
        }
      } else {
        // Show first 3 issues
        for (const issue of rule.issues.slice(0, 3)) {
          const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;
          console.log(`    ${chalk.gray(location)} ${issue.message}`);
        }
        if (rule.issues.length > 3) {
          console.log(`    ${chalk.gray(`... and ${rule.issues.length - 3} more`)}`);
        }
      }
    }
  }

  console.log('');
}

program.parse();
