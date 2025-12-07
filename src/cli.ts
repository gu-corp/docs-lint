#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { createLinter } from './linter.js';
import { generateAIPrompt, generateJSONSummary, readStandardsFile } from './ai-prompt.js';
import { getDefaultStandards } from './templates/standards.js';
import { defaultConfig, type DocsLintConfig } from './types.js';
import { glob } from 'glob';
import { createChecker } from './code/checker.js';
import { createAnalyzer } from './ai/analyzer.js';
import { defaultConfig as codeDefaultConfig } from './code/types.js';
import type { CoverageReport } from './ai/types.js';

/**
 * Interactive prompt helper
 */
function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const displayQuestion = defaultValue
    ? `${question} [${defaultValue}]: `
    : `${question}: `;

  return new Promise((resolve) => {
    rl.question(displayQuestion, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

/**
 * Select from options
 */
function selectOption(question: string, options: string[], defaultIndex = 0): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(`\n${question}`);
  options.forEach((opt, i) => {
    const marker = i === defaultIndex ? chalk.green('→') : ' ';
    console.log(`  ${marker} ${i + 1}) ${opt}`);
  });

  return new Promise((resolve) => {
    rl.question(`Select [${defaultIndex + 1}]: `, (answer) => {
      rl.close();
      const idx = answer.trim() ? parseInt(answer, 10) - 1 : defaultIndex;
      resolve(options[idx] || options[defaultIndex]);
    });
  });
}

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
      const config = await loadConfig(options.config, options.docsDir);
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
  .description('Initialize docs-lint configuration with interactive wizard')
  .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
  .option('-y, --yes', 'Skip wizard, use defaults', false)
  .action(async (options) => {
    const configPath = path.join(process.cwd(), 'docs-lint.config.json');
    const docsConfigPath = path.join(options.docsDir, 'docs.config.json');

    if (fs.existsSync(configPath) && !options.yes) {
      console.error(chalk.yellow('Configuration file already exists:', configPath));
      console.log(chalk.gray('Use --yes to overwrite with defaults'));
      process.exit(1);
    }

    console.log(chalk.bold('\n📚 docs-lint Setup Wizard\n'));

    let commonLang = 'en';
    let draftLangs: string[] = [];
    let teams: Record<string, string> = {};
    let isMultiTeam = false;

    if (!options.yes) {
      // Step 1: Common language
      const langChoice = await selectOption(
        'What is the common language for cross-team documentation?',
        ['English (en)', 'Japanese (ja)', 'Other'],
        0
      );
      commonLang = langChoice.includes('en') ? 'en' : langChoice.includes('ja') ? 'ja' : await prompt('Enter language code');

      // Step 2: Team structure
      const teamChoice = await selectOption(
        'Is this a multi-team project?',
        ['Single team', 'Multi-team (different languages)'],
        0
      );
      isMultiTeam = teamChoice.includes('Multi');

      if (isMultiTeam) {
        // Step 3: Draft languages
        const drafts = await prompt('Draft languages (comma-separated, e.g., ja,vi,en)', 'ja,en');
        draftLangs = drafts.split(',').map(s => s.trim());

        // Step 4: Team configuration
        console.log(chalk.gray('\nConfigure teams (leave empty when done):'));
        let teamName = await prompt('Team name (e.g., tokyo)');
        while (teamName) {
          const teamLang = await prompt(`Language for ${teamName}`, draftLangs[0]);
          teams[teamName] = teamLang;
          teamName = await prompt('Team name (empty to finish)');
        }
      } else {
        const singleLang = await prompt('Project language', commonLang);
        commonLang = singleLang;
        draftLangs = [singleLang];
      }
    }

    // Ensure docs directory exists
    if (!fs.existsSync(options.docsDir)) {
      fs.mkdirSync(options.docsDir, { recursive: true });
    }

    // Create docs-lint.config.json
    const config: Partial<DocsLintConfig> = {
      docsDir: options.docsDir,
      include: ['**/*.md'],
      exclude: ['node_modules/**', 'drafts/**'],
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
    console.log(chalk.green('\n✓ Created:'), configPath);

    // Create docs.config.json (language settings)
    const docsConfig = {
      commonLanguage: commonLang,
      draftLanguages: draftLangs.length > 0 ? draftLangs : [commonLang],
      ...(Object.keys(teams).length > 0 && { teams }),
    };

    fs.writeFileSync(docsConfigPath, JSON.stringify(docsConfig, null, 2));
    console.log(chalk.green('✓ Created:'), docsConfigPath);

    // Summary
    console.log(chalk.bold('\n📋 Configuration Summary:\n'));
    console.log(`  Common language: ${chalk.cyan(commonLang)}`);
    if (isMultiTeam) {
      console.log(`  Draft languages: ${chalk.cyan(draftLangs.join(', '))}`);
      if (Object.keys(teams).length > 0) {
        console.log('  Teams:');
        for (const [name, lang] of Object.entries(teams)) {
          console.log(`    - ${name}: ${chalk.cyan(lang)}`);
        }
      }
    }

    console.log(chalk.gray('\nNext steps:'));
    console.log(chalk.gray('  1. Run "docs-lint init-standards" to create DOCUMENT_STANDARDS.md'));
    console.log(chalk.gray('  2. Run "docs-lint lint" to check your documentation'));
  });

program
  .command('init-standards')
  .description('Generate DOCUMENT_STANDARDS.md from G.U.Corp default template')
  .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
  .option('-f, --force', 'Overwrite existing file', false)
  .action((options) => {
    const standardsPath = path.join(options.docsDir, 'DOCUMENT_STANDARDS.md');

    if (fs.existsSync(standardsPath) && !options.force) {
      console.error(chalk.yellow('Standards file already exists:', standardsPath));
      console.log(chalk.gray('Use --force to overwrite'));
      process.exit(1);
    }

    // Ensure docs directory exists
    if (!fs.existsSync(options.docsDir)) {
      fs.mkdirSync(options.docsDir, { recursive: true });
    }

    fs.writeFileSync(standardsPath, getDefaultStandards());
    console.log(chalk.green('Created standards file:'), standardsPath);
    console.log(chalk.gray('\nThis file defines document quality standards for your project.'));
    console.log(chalk.gray('Customize it to match your project requirements.'));
    console.log(chalk.gray('\nWhen running "docs-lint lint --ai-prompt", this file will be'));
    console.log(chalk.gray('included in the output to guide AI evaluation.'));
  });

program
  .command('show-standards')
  .description('Show current document standards (project-specific or G.U.Corp default)')
  .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
  .action((options) => {
    const standards = readStandardsFile(options.docsDir);

    if (standards.isDefault) {
      console.log(chalk.yellow('Using G.U.Corp default standards'));
      console.log(chalk.gray('Run "docs-lint init-standards" to create a project-specific standards file.\n'));
    } else {
      console.log(chalk.green('Using project-specific standards\n'));
    }

    console.log(standards.content);
  });

program
  .command('check-structure')
  .description('Check folder structure and naming conventions')
  .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
  .option('--numbered', 'Expect numbered folders (01-, 02-, etc.)', false)
  .option('--upper-case', 'Expect UPPER_CASE.md file names', false)
  .action(async (options) => {
    try {
      const config = await loadConfig(undefined, options.docsDir);
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

program
  .command('sync')
  .description('Sync development standards templates to project docs')
  .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
  .option('-f, --force', 'Overwrite existing files', false)
  .option('--check', 'Check for differences without syncing', false)
  .option('--category <name>', 'Sync specific category (e.g., 04-development)', '04-development')
  .action(async (options) => {
    const templatesDir = getTemplatesDir();
    const categoryPath = path.join(templatesDir, options.category);
    const targetDir = path.join(options.docsDir, options.category);

    if (!fs.existsSync(categoryPath)) {
      console.error(chalk.red(`Template category not found: ${options.category}`));
      console.log(chalk.gray('Available categories:'));
      const categories = fs.readdirSync(templatesDir).filter(f =>
        fs.statSync(path.join(templatesDir, f)).isDirectory()
      );
      categories.forEach(c => console.log(chalk.gray(`  - ${c}`)));
      process.exit(1);
    }

    const templateFiles = fs.readdirSync(categoryPath).filter(f => f.endsWith('.md'));

    if (templateFiles.length === 0) {
      console.log(chalk.yellow('No templates found in category:', options.category));
      process.exit(0);
    }

    console.log(chalk.bold(`\n📋 Syncing ${options.category} templates\n`));

    let synced = 0;
    let skipped = 0;
    let different = 0;

    for (const file of templateFiles) {
      const sourcePath = path.join(categoryPath, file);
      const targetPath = path.join(targetDir, file);
      const sourceContent = fs.readFileSync(sourcePath, 'utf-8');

      if (fs.existsSync(targetPath)) {
        const targetContent = fs.readFileSync(targetPath, 'utf-8');
        const isDifferent = sourceContent !== targetContent;

        if (options.check) {
          if (isDifferent) {
            console.log(`${chalk.yellow('⚠')} ${file} - differs from template`);
            different++;
          } else {
            console.log(`${chalk.green('✓')} ${file} - up to date`);
          }
        } else if (options.force) {
          if (isDifferent) {
            fs.writeFileSync(targetPath, sourceContent);
            console.log(`${chalk.green('✓')} ${file} - updated`);
            synced++;
          } else {
            console.log(`${chalk.gray('○')} ${file} - already up to date`);
            skipped++;
          }
        } else {
          console.log(`${chalk.yellow('⚠')} ${file} - exists (use --force to overwrite)`);
          skipped++;
        }
      } else {
        if (options.check) {
          console.log(`${chalk.red('✗')} ${file} - missing`);
          different++;
        } else {
          // Ensure target directory exists
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          fs.writeFileSync(targetPath, sourceContent);
          console.log(`${chalk.green('✓')} ${file} - created`);
          synced++;
        }
      }
    }

    console.log('');
    if (options.check) {
      if (different > 0) {
        console.log(chalk.yellow(`${different} file(s) need syncing`));
        console.log(chalk.gray('Run without --check to sync'));
        process.exit(1);
      } else {
        console.log(chalk.green('All files are up to date'));
      }
    } else {
      console.log(chalk.green(`Synced: ${synced}`), chalk.gray(`Skipped: ${skipped}`));
    }
  });

/**
 * Get the templates directory path
 */
function getTemplatesDir(): string {
  // Templates are in ../templates relative to dist/cli.js
  const templatesPath = path.join(__dirname, '..', 'templates');

  if (fs.existsSync(templatesPath)) {
    return templatesPath;
  }

  throw new Error(`Templates directory not found at: ${templatesPath}`);
}

/**
 * Load configuration from file or defaults
 */
async function loadConfig(configPath?: string, docsDir?: string): Promise<DocsLintConfig> {
  let config: Partial<DocsLintConfig> = {};

  // Try to load from specified path or default locations
  const paths = configPath
    ? [configPath]
    : ['docs-lint.config.json', 'docs-lint.config.js', '.docs-lintrc.json'];

  for (const p of paths) {
    const fullPath = path.resolve(process.cwd(), p);
    if (fs.existsSync(fullPath)) {
      if (p.endsWith('.js')) {
        const module = await import(`file://${fullPath}`);
        config = module.default || module;
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

// ============================================
// Code & Spec Check/Review Commands
// ============================================

program
  .command('check:code')
  .description('Static code checks (test file existence, coverage)')
  .option('-s, --src-dir <path>', 'Source directory', './src')
  .option('-v, --verbose', 'Verbose output')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const config = {
        ...codeDefaultConfig,
        srcDir: options.srcDir,
      };

      const checker = createChecker(config, {
        verbose: options.verbose,
      });

      const result = await checker.check();

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.passed ? 0 : 1);
      }

      printCodeCheckResults(result, options.verbose);
      process.exit(result.passed ? 0 : 1);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('check:spec')
  .description('Static specification checks (structure, references)')
  .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
  .option('-v, --verbose', 'Verbose output')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const config = await loadConfig(undefined, options.docsDir);
      const linter = createLinter(config, {
        verbose: options.verbose,
        only: ['structureCheck', 'crossReferences', 'brokenLinks'],
      });

      const result = await linter.lint();

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.passed ? 0 : 1);
      }

      console.log(chalk.bold('\n📋 Specification Check Results\n'));
      printResults(result, options.verbose);
      process.exit(result.passed ? 0 : 1);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('review:code')
  .description('AI-powered code review (requirement coverage)')
  .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
  .option('-s, --src-dir <path>', 'Source directory', './src')
  .option('--spec-patterns <patterns>', 'Spec file patterns (comma-separated)', '**/*SPEC*.md,**/*FUNCTIONAL*.md,**/*API*.md,**/*SCREEN*.md,**/*REQUIREMENTS*.md')
  .option('--source-patterns <patterns>', 'Source file patterns (comma-separated)', '**/*.ts,**/*.tsx,**/*.js,**/*.jsx')
  .option('-v, --verbose', 'Verbose output')
  .option('--json', 'Output as JSON')
  .option('--model <model>', 'AI model to use', 'claude-sonnet-4-20250514')
  .action(async (options) => {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.error(chalk.red('Error: ANTHROPIC_API_KEY environment variable is required'));
        console.log(chalk.gray('Set it in .env file or export ANTHROPIC_API_KEY=...'));
        process.exit(1);
      }

      console.log(chalk.bold('\n🤖 AI Code Review - Requirement Coverage\n'));

      const analyzer = createAnalyzer({
        docsDir: options.docsDir,
        srcDir: options.srcDir,
        specPatterns: options.specPatterns.split(','),
        sourcePatterns: options.sourcePatterns.split(','),
        model: options.model,
        verbose: options.verbose,
      });

      const report = await analyzer.analyze();

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        printCoverageReport(report, options.verbose);
      }

      process.exit(report.percentage >= 70 ? 0 : 1);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('review:spec')
  .description('AI-powered specification review (consistency, terminology)')
  .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
  .option('-v, --verbose', 'Verbose output')
  .option('--json', 'Output as JSON')
  .option('--model <model>', 'AI model to use', 'claude-sonnet-4-20250514')
  .action(async (options) => {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.error(chalk.red('Error: ANTHROPIC_API_KEY environment variable is required'));
        console.log(chalk.gray('Set it in .env file or export ANTHROPIC_API_KEY=...'));
        process.exit(1);
      }

      console.log(chalk.bold('\n🤖 AI Specification Review\n'));
      console.log(chalk.yellow('Coming soon: Document consistency and terminology analysis'));
      console.log(chalk.gray('\nFor now, use "docs-lint lint --ai-prompt" to generate AI review prompts'));
      process.exit(0);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Print code check results
 */
function printCodeCheckResults(
  result: Awaited<ReturnType<typeof createChecker.prototype.check>>,
  verbose?: boolean
) {
  console.log(chalk.bold('\n🔍 Code Check Results\n'));
  console.log(`Source files: ${result.sourceFilesChecked}`);
  console.log(`Test files: ${result.testFilesFound}`);
  console.log(
    `Test coverage: ${chalk.cyan(result.summary.coverage.percentage + '%')} (${result.summary.coverage.testedFiles}/${result.summary.coverage.sourceFiles})`
  );
  console.log(
    `Status: ${result.passed ? chalk.green('PASSED') : chalk.red('FAILED')}\n`
  );

  console.log(chalk.bold('Summary:'));
  console.log(`  ${chalk.red('Errors:')} ${result.summary.errors}`);
  console.log(`  ${chalk.yellow('Warnings:')} ${result.summary.warnings}`);
  console.log(`  ${chalk.green('Passed:')} ${result.summary.passed}\n`);

  for (const rule of result.ruleResults) {
    const icon = rule.passed
      ? chalk.green('✓')
      : rule.severity === 'error'
        ? chalk.red('✗')
        : chalk.yellow('⚠');
    const label =
      rule.severity === 'error'
        ? chalk.red(rule.rule)
        : rule.severity === 'warn'
          ? chalk.yellow(rule.rule)
          : rule.rule;

    if (rule.issues.length === 0) {
      if (verbose) {
        console.log(`${icon} ${label}`);
      }
    } else {
      console.log(`${icon} ${label} (${rule.issues.length} issues)`);

      if (verbose) {
        for (const issue of rule.issues) {
          console.log(`    ${chalk.gray(issue.file)} ${issue.message}`);
          if (issue.suggestion) {
            console.log(`      ${chalk.blue('→')} ${issue.suggestion}`);
          }
        }
      } else {
        for (const issue of rule.issues.slice(0, 3)) {
          console.log(`    ${chalk.gray(issue.file)} ${issue.message}`);
        }
        if (rule.issues.length > 3) {
          console.log(`    ${chalk.gray(`... and ${rule.issues.length - 3} more`)}`);
        }
      }
    }
  }

  console.log('');
}

/**
 * Print AI coverage report
 */
function printCoverageReport(report: CoverageReport, verbose?: boolean) {
  console.log(chalk.bold('📊 Requirement Coverage Report\n'));
  console.log(`Total requirements: ${report.totalRequirements}`);
  console.log(`Coverage: ${chalk.cyan(report.percentage + '%')}`);

  console.log(chalk.bold('\nStatus breakdown:'));
  console.log(`  ${chalk.green('✓ Implemented:')} ${report.coverage.implemented}`);
  console.log(`  ${chalk.yellow('◐ Partial:')} ${report.coverage.partial}`);
  console.log(`  ${chalk.red('✗ Not implemented:')} ${report.coverage.notImplemented}`);
  console.log(`  ${chalk.gray('? Unknown:')} ${report.coverage.unknown}`);

  if (Object.keys(report.byCategory).length > 0) {
    console.log(chalk.bold('\nBy category:'));
    for (const [cat, stats] of Object.entries(report.byCategory)) {
      const bar = getProgressBar(stats.percentage);
      console.log(`  ${cat}: ${bar} ${stats.percentage}% (${stats.implemented}/${stats.total})`);
    }
  }

  if (verbose) {
    console.log(chalk.bold('\nDetails:'));
    for (const cov of report.details) {
      const icon = cov.status === 'implemented'
        ? chalk.green('✓')
        : cov.status === 'partial'
          ? chalk.yellow('◐')
          : cov.status === 'not_implemented'
            ? chalk.red('✗')
            : chalk.gray('?');

      console.log(`\n${icon} [${cov.requirement.id}] ${cov.requirement.description}`);
      console.log(`   ${chalk.gray(`Source: ${cov.requirement.sourceFile} | Category: ${cov.requirement.category} | Priority: ${cov.requirement.priority}`)}`);
      console.log(`   ${chalk.gray(`Confidence: ${cov.confidence}%`)}`);
      if (cov.implementedIn.length > 0) {
        console.log(`   ${chalk.blue('Tested in:')} ${cov.implementedIn.join(', ')}`);
      }
      console.log(`   ${chalk.gray(cov.evidence)}`);
      if (cov.suggestion) {
        console.log(`   ${chalk.yellow('Missing:')} ${cov.suggestion}`);
      }
    }
  } else {
    const notImplemented = report.details.filter(d => d.status === 'not_implemented');
    if (notImplemented.length > 0) {
      console.log(chalk.bold('\nNot implemented:'));
      for (const cov of notImplemented.slice(0, 5)) {
        console.log(`  ${chalk.red('✗')} [${cov.requirement.id}] ${cov.requirement.description.substring(0, 60)}...`);
      }
      if (notImplemented.length > 5) {
        console.log(`  ${chalk.gray(`... and ${notImplemented.length - 5} more`)}`);
      }
    }
  }

  console.log('');
}

/**
 * Generate progress bar
 */
function getProgressBar(percentage: number): string {
  const width = 20;
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

program.parse();
