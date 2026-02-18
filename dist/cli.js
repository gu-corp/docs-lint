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
import { defaultConfig } from './types.js';
import { glob } from 'glob';
import { createChecker } from './code/checker.js';
import { createAnalyzer } from './ai/analyzer.js';
import { defaultConfig as codeDefaultConfig } from './code/types.js';
// CLI utilities
import { loadConfig } from './cli/config.js';
import { prompt, selectOption } from './cli/utils.js';
import { printResults, printCodeCheckResults, printCoverageReport, printSpecReviewReport } from './cli/formatters.js';
import { createSpecAnalyzer } from './ai/spec-analyzer.js';
import { generateSpecReviewPrompt, generateDesignReviewPrompt, generateCodeReviewPrompt } from './ai/review-prompt.js';
import { fixMarkdownLint } from './rules/index.js';
// Read version from package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const program = new Command();
program
    .name('docs-lint')
    .description('Lint and validate documentation structure and quality')
    .version(packageJson.version);
// ============================================
// lint - Main linting command
// ============================================
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
    .option('--fix', 'Automatically fix markdown formatting issues')
    .action(async (options) => {
    try {
        const config = await loadConfig(options.config, options.docsDir);
        // Handle --fix option
        if (options.fix) {
            const files = await glob('**/*.md', { cwd: config.docsDir, ignore: config.exclude });
            console.log(chalk.bold('\n🔧 Auto-fixing markdown issues...\n'));
            const { fixed, errors } = await fixMarkdownLint(config.docsDir, files, config.rules.markdownLint);
            if (fixed > 0) {
                console.log(chalk.green(`✓ Fixed ${fixed} file(s)`));
            }
            else {
                console.log(chalk.gray('No auto-fixable issues found'));
            }
            if (errors.length > 0) {
                console.log(chalk.yellow('\nErrors during fix:'));
                errors.forEach(e => console.log(chalk.red(`  ${e}`)));
            }
            console.log(chalk.gray('\nRe-running lint to check remaining issues...\n'));
        }
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
// ============================================
// init - Initialize configuration (unified)
// ============================================
program
    .command('init')
    .description('Initialize docs-lint configuration')
    .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
    .option('-y, --yes', 'Skip wizard, use defaults', false)
    .option('--standards', 'Also generate DOCUMENT_STANDARDS.md', false)
    .option('--scaffold', 'Also create standard folder structure', false)
    .action(async (options) => {
    const configPath = path.join(process.cwd(), 'docs-lint.config.json');
    const docsConfigPath = path.join(options.docsDir, 'docs.config.json');
    if (fs.existsSync(configPath) && !options.yes) {
        console.error(chalk.yellow('Configuration file already exists:', configPath));
        console.log(chalk.gray('Use --yes to overwrite with defaults'));
        process.exit(1);
    }
    console.log(chalk.bold('\n📚 docs-lint Setup\n'));
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
    // Handle --standards option
    if (options.standards) {
        const standardsPath = path.join(options.docsDir, 'DOCUMENT_STANDARDS.md');
        if (!fs.existsSync(standardsPath)) {
            fs.writeFileSync(standardsPath, getDefaultStandards());
            console.log(chalk.green('✓ Created:'), standardsPath);
        }
        else {
            console.log(chalk.gray('○ Standards file already exists'));
        }
    }
    // Handle --scaffold option
    if (options.scaffold) {
        console.log(chalk.bold('\n📁 Creating folder structure\n'));
        const folders = [
            '01-plan',
            '02-spec',
            '02-spec/01-requirements',
            '02-spec/02-architecture',
            '02-spec/03-specifications',
            '02-spec/04-testing',
            '02-spec/05-reference',
            '03-guide',
            '04-development',
        ];
        for (const folder of folders) {
            const folderPath = path.join(options.docsDir, folder);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
                console.log(chalk.green('✓'), folder + '/');
            }
            else {
                console.log(chalk.gray('○'), folder + '/ (exists)');
            }
        }
    }
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
    console.log(chalk.gray('  1. Run "docs-lint lint" to check your documentation'));
    console.log(chalk.gray('  2. Run "docs-lint lint --fix" to auto-fix markdown formatting issues'));
    if (!options.standards) {
        console.log(chalk.gray('  3. Run "docs-lint init --standards" to create DOCUMENT_STANDARDS.md'));
    }
    if (!options.scaffold) {
        console.log(chalk.gray('  4. Run "docs-lint init --scaffold" to create standard folder structure'));
    }
});
// ============================================
// check - Static checks (subcommands)
// ============================================
const checkCmd = program
    .command('check')
    .description('Run static checks');
checkCmd
    .command('code')
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
    }
    catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
checkCmd
    .command('spec')
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
    }
    catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
// ============================================
// review - AI review (subcommands)
// ============================================
const reviewCmd = program
    .command('review')
    .description('AI-powered review (generates prompt or calls API)');
reviewCmd
    .command('code')
    .description('Generate code review prompt for requirement coverage')
    .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
    .option('-s, --src-dir <path>', 'Source directory', './src')
    .option('--spec-patterns <patterns>', 'Spec file patterns (comma-separated)', '**/*SPEC*.md,**/*FUNCTIONAL*.md,**/*API*.md,**/*SCREEN*.md,**/*REQUIREMENTS*.md')
    .option('--source-patterns <patterns>', 'Source file patterns (comma-separated)', '**/*.ts,**/*.tsx,**/*.js,**/*.jsx')
    .option('--api', 'Run with Anthropic API instead of generating prompt', false)
    .option('-v, --verbose', 'Verbose output')
    .option('--json', 'Output as JSON')
    .option('--model <model>', 'AI model to use (with --api)', 'claude-sonnet-4-20250514')
    .action(async (options) => {
    try {
        // Default mode: Generate prompt for chat AI
        if (!options.api) {
            const prompt = generateCodeReviewPrompt({
                docsDir: options.docsDir,
                srcDir: options.srcDir,
                specPatterns: options.specPatterns.split(','),
                sourcePatterns: options.sourcePatterns.split(','),
                verbose: options.verbose,
            });
            console.log(prompt);
            console.log(chalk.gray('\n---'));
            console.log(chalk.gray('上記のプロンプトをAIに送信してレビューを実行してください。'));
            console.log(chalk.gray('または --api オプションでAnthropic APIを直接呼び出せます。'));
            process.exit(0);
        }
        // API mode: Call Anthropic API directly
        if (!process.env.ANTHROPIC_API_KEY) {
            console.error(chalk.red('Error: ANTHROPIC_API_KEY environment variable is required'));
            console.log(chalk.gray('Set it in .env file or export ANTHROPIC_API_KEY=...'));
            console.log(chalk.gray('\nOr run without --api to generate a prompt for chat AI.'));
            process.exit(1);
        }
        console.log(chalk.bold('\n🤖 AI Code Review - Requirement Coverage (API Mode)\n'));
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
        }
        else {
            printCoverageReport(report, options.verbose);
        }
        process.exit(report.percentage >= 70 ? 0 : 1);
    }
    catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
reviewCmd
    .command('spec')
    .description('Generate specification review prompt (includes MECE check)')
    .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
    .option('-s, --src-dir <path>', 'Source directory (for design-implementation check)', './src')
    .option('--design', 'Focus on design-implementation consistency', false)
    .option('--api', 'Run with Anthropic API instead of generating prompt', false)
    .option('-v, --verbose', 'Verbose output')
    .option('--json', 'Output as JSON')
    .option('--model <model>', 'AI model to use (with --api)', 'claude-sonnet-4-20250514')
    .action(async (options) => {
    try {
        // Default mode: Generate prompt for chat AI
        if (!options.api) {
            const prompt = options.design
                ? generateDesignReviewPrompt({
                    docsDir: options.docsDir,
                    srcDir: options.srcDir,
                    verbose: options.verbose,
                })
                : generateSpecReviewPrompt({
                    docsDir: options.docsDir,
                    srcDir: options.srcDir,
                    verbose: options.verbose,
                });
            console.log(prompt);
            console.log(chalk.gray('\n---'));
            console.log(chalk.gray('上記のプロンプトをAIに送信してレビューを実行してください。'));
            console.log(chalk.gray('または --api オプションでAnthropic APIを直接呼び出せます。'));
            process.exit(0);
        }
        // API mode: Call Anthropic API directly
        if (!process.env.ANTHROPIC_API_KEY) {
            console.error(chalk.red('Error: ANTHROPIC_API_KEY environment variable is required'));
            console.log(chalk.gray('Set it in .env file or export ANTHROPIC_API_KEY=...'));
            console.log(chalk.gray('\nOr run without --api to generate a prompt for chat AI.'));
            process.exit(1);
        }
        console.log(chalk.bold('\n🤖 AI Specification Review (API Mode)\n'));
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
        }
        else {
            printSpecReviewReport(report, options.verbose);
        }
        // Exit with error if quality score is below 60 or there are errors
        const hasErrors = report.issues.some(i => i.severity === 'error');
        process.exit(hasErrors || report.qualityScore < 60 ? 1 : 0);
    }
    catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
// ============================================
// show - Display information (subcommands)
// ============================================
const showCmd = program
    .command('show')
    .description('Display information');
showCmd
    .command('standards')
    .description('Show current document standards')
    .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
    .action((options) => {
    const standards = readStandardsFile(options.docsDir);
    if (standards.isDefault) {
        console.log(chalk.yellow('Using G.U.Corp default standards'));
        console.log(chalk.gray('Run "docs-lint init --standards" to create a project-specific standards file.\n'));
    }
    else {
        console.log(chalk.green('Using project-specific standards\n'));
    }
    console.log(standards.content);
});
showCmd
    .command('config')
    .description('Show current configuration')
    .option('-c, --config <path>', 'Configuration file path')
    .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
    .action(async (options) => {
    try {
        const config = await loadConfig(options.config, options.docsDir);
        console.log(chalk.bold('\n📋 Current Configuration\n'));
        console.log(JSON.stringify(config, null, 2));
    }
    catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
showCmd
    .command('rules')
    .description('Show available lint rules')
    .action(() => {
    console.log(chalk.bold('\n📋 Available Lint Rules\n'));
    const rules = [
        { name: 'brokenLinks', default: 'error', desc: 'Detect broken internal links' },
        { name: 'legacyFileNames', default: 'error', desc: 'Detect legacy file naming patterns' },
        { name: 'versionInfo', default: 'warn', desc: 'Check for version information' },
        { name: 'relatedDocuments', default: 'warn', desc: 'Check for related documents section' },
        { name: 'headingHierarchy', default: 'warn', desc: 'Check heading hierarchy (H1→H2→H3)' },
        { name: 'todoComments', default: 'warn', desc: 'Detect TODO/FIXME/BUG comments' },
        { name: 'codeBlockLanguage', default: 'warn', desc: 'Check code block language specifiers' },
        { name: 'orphanDocuments', default: 'warn', desc: 'Detect documents not linked from anywhere' },
        { name: 'terminology', default: 'warn', desc: 'Check terminology consistency' },
        { name: 'bidirectionalRefs', default: 'off', desc: 'Check bidirectional references' },
        { name: 'markdownLint', default: 'warn', desc: 'Markdown formatting (markdownlint)' },
        { name: 'standardFolderStructure', default: 'error', desc: 'Check G.U.Corp folder structure' },
        { name: 'folderNumbering', default: 'warn', desc: 'Check folder numbering sequence' },
        { name: 'fileNaming', default: 'warn', desc: 'Check UPPER-CASE.md naming' },
        { name: 'standardFileNames', default: 'warn', desc: 'Check standard file names exist' },
        { name: 'requirementTestMapping', default: 'warn', desc: 'Check FR-XXX ↔ TC-XXX mapping' },
        { name: 'requirementsCoverage', default: 'warn', desc: 'Check requirements coverage' },
        { name: 'standardsDrift', default: 'warn', desc: 'Check drift from templates' },
    ];
    console.log('| Rule | Default | Description |');
    console.log('|------|---------|-------------|');
    for (const rule of rules) {
        const defaultColor = rule.default === 'error' ? chalk.red : rule.default === 'warn' ? chalk.yellow : chalk.gray;
        console.log(`| ${rule.name} | ${defaultColor(rule.default)} | ${rule.desc} |`);
    }
    console.log(chalk.gray('\nSeverity levels: error (fails CI), warn (passes CI), off (disabled)'));
    console.log(chalk.gray('Configure in docs-lint.config.json'));
});
// ============================================
// Legacy command aliases (for backward compatibility - will be removed in v3)
// ============================================
program
    .command('init-standards', { hidden: true })
    .description('[DEPRECATED] Use "init --standards" instead')
    .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
    .option('-f, --force', 'Overwrite existing file', false)
    .action((options) => {
    console.log(chalk.yellow('⚠️  This command is deprecated. Use "docs-lint init --standards" instead.\n'));
    const standardsPath = path.join(options.docsDir, 'DOCUMENT_STANDARDS.md');
    if (fs.existsSync(standardsPath) && !options.force) {
        console.error(chalk.yellow('Standards file already exists:', standardsPath));
        console.log(chalk.gray('Use --force to overwrite'));
        process.exit(1);
    }
    if (!fs.existsSync(options.docsDir)) {
        fs.mkdirSync(options.docsDir, { recursive: true });
    }
    fs.writeFileSync(standardsPath, getDefaultStandards());
    console.log(chalk.green('Created standards file:'), standardsPath);
});
program
    .command('show-standards', { hidden: true })
    .description('[DEPRECATED] Use "show standards" instead')
    .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
    .action((options) => {
    console.log(chalk.yellow('⚠️  This command is deprecated. Use "docs-lint show standards" instead.\n'));
    const standards = readStandardsFile(options.docsDir);
    if (standards.isDefault) {
        console.log(chalk.yellow('Using G.U.Corp default standards\n'));
    }
    else {
        console.log(chalk.green('Using project-specific standards\n'));
    }
    console.log(standards.content);
});
program
    .command('scaffold', { hidden: true })
    .description('[DEPRECATED] Use "init --scaffold" instead')
    .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
    .action((options) => {
    console.log(chalk.yellow('⚠️  This command is deprecated. Use "docs-lint init --scaffold" instead.\n'));
    const folders = [
        '01-plan',
        '02-spec',
        '02-spec/01-requirements',
        '02-spec/02-architecture',
        '02-spec/03-specifications',
        '02-spec/04-testing',
        '02-spec/05-reference',
        '03-guide',
        '04-development',
    ];
    for (const folder of folders) {
        const folderPath = path.join(options.docsDir, folder);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
            console.log(chalk.green('✓'), folder + '/');
        }
        else {
            console.log(chalk.gray('○'), folder + '/ (exists)');
        }
    }
});
program
    .command('check-structure', { hidden: true })
    .description('[DEPRECATED] Use "lint" instead (includes structure checks)')
    .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
    .action(async (options) => {
    console.log(chalk.yellow('⚠️  This command is deprecated. Use "docs-lint lint" instead.\n'));
    console.log(chalk.gray('Structure checks are included in the lint command via standardFolderStructure rule.\n'));
    const config = await loadConfig(undefined, options.docsDir);
    const linter = createLinter(config, {
        only: ['standardFolderStructure', 'folderNumbering', 'fileNaming'],
    });
    const result = await linter.lint();
    printResults(result, false);
    process.exit(result.passed ? 0 : 1);
});
// Legacy colon-style commands
program
    .command('check:code', { hidden: true })
    .description('[DEPRECATED] Use "check code" instead')
    .option('-s, --src-dir <path>', 'Source directory', './src')
    .option('-v, --verbose', 'Verbose output')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
    console.log(chalk.yellow('⚠️  This command is deprecated. Use "docs-lint check code" instead.\n'));
    const config = { ...codeDefaultConfig, srcDir: options.srcDir };
    const checker = createChecker(config, { verbose: options.verbose });
    const result = await checker.check();
    if (options.json) {
        console.log(JSON.stringify(result, null, 2));
    }
    else {
        printCodeCheckResults(result, options.verbose);
    }
    process.exit(result.passed ? 0 : 1);
});
program
    .command('check:spec', { hidden: true })
    .description('[DEPRECATED] Use "check spec" instead')
    .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
    .option('-v, --verbose', 'Verbose output')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
    console.log(chalk.yellow('⚠️  This command is deprecated. Use "docs-lint check spec" instead.\n'));
    const config = await loadConfig(undefined, options.docsDir);
    const linter = createLinter(config, {
        verbose: options.verbose,
        only: ['structureCheck', 'crossReferences', 'brokenLinks'],
    });
    const result = await linter.lint();
    if (options.json) {
        console.log(JSON.stringify(result, null, 2));
    }
    else {
        printResults(result, options.verbose);
    }
    process.exit(result.passed ? 0 : 1);
});
program
    .command('review:code', { hidden: true })
    .description('[DEPRECATED] Use "review code" instead')
    .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
    .option('-s, --src-dir <path>', 'Source directory', './src')
    .action(async (options) => {
    console.log(chalk.yellow('⚠️  This command is deprecated. Use "docs-lint review code" instead.\n'));
    const prompt = generateCodeReviewPrompt({
        docsDir: options.docsDir,
        srcDir: options.srcDir,
        specPatterns: ['**/*SPEC*.md', '**/*REQUIREMENTS*.md'],
        sourcePatterns: ['**/*.ts', '**/*.tsx'],
    });
    console.log(prompt);
});
program
    .command('review:spec', { hidden: true })
    .description('[DEPRECATED] Use "review spec" instead')
    .option('-d, --docs-dir <path>', 'Documentation directory', './docs')
    .option('-s, --src-dir <path>', 'Source directory', './src')
    .action(async (options) => {
    console.log(chalk.yellow('⚠️  This command is deprecated. Use "docs-lint review spec" instead.\n'));
    const prompt = generateSpecReviewPrompt({
        docsDir: options.docsDir,
        srcDir: options.srcDir,
    });
    console.log(prompt);
});
program.parse();
//# sourceMappingURL=cli.js.map