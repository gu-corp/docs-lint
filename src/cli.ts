#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { createLinter } from './linter.js';
import { generateAIPrompt, generateJSONSummary, readStandardsFile } from './ai/prompt.js';
import { getDefaultStandards } from './templates/standards.js';
import { defaultConfig, type DocsLintConfig } from './types.js';
import { glob } from 'glob';
import { createChecker } from './code/checker.js';
import { createAnalyzer } from './ai/analyzer.js';
import { defaultConfig as codeDefaultConfig } from './code/types.js';

// CLI utilities
import { loadConfig } from './cli/config.js';
import { prompt, selectOption, getTemplatesDir } from './cli/utils.js';
import { printResults, printCodeCheckResults, printCoverageReport, printSpecReviewReport } from './cli/formatters.js';
import { createSpecAnalyzer } from './ai/spec-analyzer.js';

// Read version from package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

const program = new Command();

program
  .name('docs-lint')
  .description('Lint and validate documentation structure and quality')
  .version(packageJson.version);

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
    const templatesDir = getTemplatesDir(__dirname);
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

program
  .command('scaffold')
  .description('Create G.U.Corp standard folder structure')
  .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
  .option('--with-templates', 'Include template files (README, REQUIREMENTS, etc.)', false)
  .option('--dry-run', 'Show what would be created without creating', false)
  .action(async (options) => {
    const docsDir = path.resolve(options.docsDir);

    console.log(chalk.bold('\n📁 Creating G.U.Corp Standard Structure\n'));

    const folders = [
      { path: '01-plan', desc: 'Planning & proposals' },
      { path: '02-spec', desc: 'Specifications' },
      { path: '02-spec/01-requirements', desc: 'Requirements' },
      { path: '02-spec/02-design', desc: 'Design (API, Architecture, Database, Screen)' },
      { path: '02-spec/03-infrastructure', desc: 'Infrastructure, deployment, security' },
      { path: '02-spec/04-testing', desc: 'Test specifications' },
      { path: '03-guide', desc: 'Guides & manuals (SysOps)' },
      { path: '04-development', desc: 'Development standards (DevOps)' },
    ];

    const templates: Array<{ path: string; content: string }> = [
      {
        path: 'README.md',
        content: `# Documentation\n\nThis folder contains project documentation.\n\n## Structure\n\n- \`01-plan/\` - Planning & proposals\n- \`02-spec/\` - Specifications\n- \`03-guide/\` - Guides & manuals\n- \`04-development/\` - Development standards\n`,
      },
      {
        path: '01-plan/PROPOSAL.md',
        content: `# Project Proposal\n\n**Version**: 1.0\n**Updated**: ${new Date().toISOString().split('T')[0]}\n\n---\n\n## Overview\n\n[Project overview and objectives]\n\n## Goals\n\n- [Goal 1]\n- [Goal 2]\n\n## Scope\n\n### In Scope\n\n- [Feature 1]\n\n### Out of Scope\n\n- [Excluded feature]\n\n---\n\n## Related Documents\n\n- [Requirements](../02-spec/01-requirements/REQUIREMENTS.md)\n`,
      },
      {
        path: '02-spec/01-requirements/REQUIREMENTS.md',
        content: `# Requirements\n\n**Version**: 1.0\n**Updated**: ${new Date().toISOString().split('T')[0]}\n\n---\n\n## Overview\n\nThis document defines functional requirements.\n\n## Functional Requirements\n\n| ID | Requirement | Priority | Version |\n|----|-------------|----------|--------|\n| FR-001 | [Description] | High | v1 |\n| FR-002 | [Description] | Medium | v1 |\n\n---\n\n## Related Documents\n\n- [Architecture](../02-design/ARCHITECTURE.md)\n`,
      },
      {
        path: '02-spec/02-design/ARCHITECTURE.md',
        content: `# Architecture\n\n**Version**: 1.0\n**Updated**: ${new Date().toISOString().split('T')[0]}\n\n---\n\n## Overview\n\n[System architecture overview]\n\n## Components\n\n### [Component 1]\n\n[Description]\n\n## Technology Stack\n\n- [Technology 1]\n- [Technology 2]\n\n---\n\n## Related Documents\n\n- [Requirements](../01-requirements/REQUIREMENTS.md)\n- [API](./API.md)\n`,
      },
      {
        path: '02-spec/04-testing/TEST-CASES.md',
        content: `# Test Cases\n\n**Version**: 1.0\n**Updated**: ${new Date().toISOString().split('T')[0]}\n\n---\n\n## Overview\n\nThis document defines test cases for requirements coverage.\n\n## Test Cases\n\n| ID | Requirement | Description | Expected |\n|----|-------------|-------------|----------|\n| TC-U001 | FR-001 | [Test description] | [Expected result] |\n\n---\n\n## Related Documents\n\n- [Requirements](../01-requirements/REQUIREMENTS.md)\n`,
      },
    ];

    let created = 0;
    let skipped = 0;

    // Create folders
    for (const folder of folders) {
      const folderPath = path.join(docsDir, folder.path);
      const exists = fs.existsSync(folderPath);

      if (options.dryRun) {
        console.log(`${exists ? chalk.gray('○') : chalk.green('+')} ${folder.path}/`);
      } else {
        if (!exists) {
          fs.mkdirSync(folderPath, { recursive: true });
          console.log(`${chalk.green('✓')} ${folder.path}/`);
          created++;
        } else {
          console.log(`${chalk.gray('○')} ${folder.path}/ (exists)`);
          skipped++;
        }
      }
    }

    // Create template files
    if (options.withTemplates) {
      console.log(chalk.bold('\n📄 Creating template files\n'));

      for (const template of templates) {
        const filePath = path.join(docsDir, template.path);
        const exists = fs.existsSync(filePath);

        if (options.dryRun) {
          console.log(`${exists ? chalk.gray('○') : chalk.green('+')} ${template.path}`);
        } else {
          if (!exists) {
            // Ensure parent directory exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(filePath, template.content);
            console.log(`${chalk.green('✓')} ${template.path}`);
            created++;
          } else {
            console.log(`${chalk.gray('○')} ${template.path} (exists)`);
            skipped++;
          }
        }
      }
    }

    console.log('');
    if (options.dryRun) {
      console.log(chalk.yellow('Dry run - no changes made'));
      console.log(chalk.gray('Run without --dry-run to create'));
    } else {
      console.log(chalk.green(`Created: ${created}`), chalk.gray(`Skipped: ${skipped}`));
      if (!options.withTemplates) {
        console.log(chalk.gray('\nTip: Use --with-templates to also create template files'));
      }
    }
  });


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

      // Load config to get terminology
      const config = await loadConfig(undefined, options.docsDir);

      const analyzer = createSpecAnalyzer({
        docsDir: options.docsDir,
        model: options.model,
        verbose: options.verbose,
        terminology: config.terminology,
      });

      const report = await analyzer.review();

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        printSpecReviewReport(report, options.verbose);
      }

      // Exit with error if quality score is below 60 or there are errors
      const hasErrors = report.issues.some(i => i.severity === 'error');
      process.exit(hasErrors || report.qualityScore < 60 ? 1 : 0);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
