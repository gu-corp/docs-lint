#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { createLinter } from './linter.js';
import { generateAIPrompt, generateJSONSummary, readStandardsFile } from './ai-prompt.js';
import { getDefaultStandards } from './templates/standards.js';
import { defaultConfig } from './types.js';
import { glob } from 'glob';
/**
 * Interactive prompt helper
 */
function prompt(question, defaultValue) {
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
function selectOption(question, options, defaultIndex = 0) {
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
    }
    catch (error) {
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
    let draftLangs = [];
    let teams = {};
    let isMultiTeam = false;
    if (!options.yes) {
        // Step 1: Common language
        const langChoice = await selectOption('What is the common language for cross-team documentation?', ['English (en)', 'Japanese (ja)', 'Other'], 0);
        commonLang = langChoice.includes('en') ? 'en' : langChoice.includes('ja') ? 'ja' : await prompt('Enter language code');
        // Step 2: Team structure
        const teamChoice = await selectOption('Is this a multi-team project?', ['Single team', 'Multi-team (different languages)'], 0);
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
        }
        else {
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
    const config = {
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
    }
    else {
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
                if (result.severity === 'error')
                    hasErrors = true;
            }
        }
        if (!hasErrors) {
            console.log(chalk.green('\n✓ Structure checks passed'));
        }
        process.exit(hasErrors ? 1 : 0);
    }
    catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
/**
 * Load configuration from file or defaults
 */
async function loadConfig(configPath, docsDir) {
    let config = {};
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
            }
            else {
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
function printResults(result, verbose) {
    console.log(chalk.bold('\n📄 Documentation Lint Results\n'));
    console.log(`Files checked: ${result.filesChecked}`);
    console.log(`Status: ${result.passed ? chalk.green('PASSED') : chalk.red('FAILED')}\n`);
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
        }
        else {
            console.log(`${icon} ${label} (${rule.issues.length} issues)`);
            if (verbose) {
                for (const issue of rule.issues) {
                    const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;
                    console.log(`    ${chalk.gray(location)} ${issue.message}`);
                    if (issue.suggestion) {
                        console.log(`      ${chalk.blue('→')} ${issue.suggestion}`);
                    }
                }
            }
            else {
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
//# sourceMappingURL=cli.js.map