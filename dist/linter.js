import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { defaultConfig, } from './types.js';
import { checkBrokenLinks, checkLegacyFileNames, checkVersionInfo, checkRelatedDocuments, checkHeadingHierarchy, checkTodoComments, checkCodeBlockLanguage, checkOrphanDocuments, checkTerminology, checkBidirectionalRefs, checkRequiredFiles, checkStandardsDrift, checkRequirementTestMapping, checkMarkdownLint, } from './rules/index.js';
import { checkFolderStructure, checkFolderNumbering, checkFileNaming, checkDuplicateContent, checkI18nStructure, checkStandardFileNames, checkStandardFolderStructure, } from './rules/structure.js';
/**
 * Main linter class
 */
export class DocsLinter {
    config;
    options;
    constructor(config, options = {}) {
        this.config = config;
        this.options = options;
    }
    /**
     * Run all enabled rules and return results
     */
    async lint() {
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
        const ruleResults = [];
        // Broken Links
        if (this.shouldRun('brokenLinks')) {
            ruleResults.push(await this.runRule('brokenLinks', () => checkBrokenLinks(docsDir, files, this.config.rules.brokenLinks)));
        }
        // Legacy File Names
        if (this.shouldRun('legacyFileNames')) {
            ruleResults.push(await this.runRule('legacyFileNames', () => checkLegacyFileNames(docsDir, files, this.config.rules.legacyFileNames)));
        }
        // Version Info
        if (this.shouldRun('versionInfo')) {
            ruleResults.push(await this.runRule('versionInfo', () => checkVersionInfo(docsDir, files, this.config.rules.versionInfo)));
        }
        // Related Documents
        if (this.shouldRun('relatedDocuments')) {
            ruleResults.push(await this.runRule('relatedDocuments', () => checkRelatedDocuments(docsDir, files, this.config.rules.relatedDocuments)));
        }
        // Heading Hierarchy
        if (this.shouldRun('headingHierarchy')) {
            ruleResults.push(await this.runRule('headingHierarchy', () => checkHeadingHierarchy(docsDir, files)));
        }
        // TODO Comments
        if (this.shouldRun('todoComments')) {
            ruleResults.push(await this.runRule('todoComments', () => checkTodoComments(docsDir, files, this.config.rules.todoComments)));
        }
        // Code Block Language
        if (this.shouldRun('codeBlockLanguage')) {
            ruleResults.push(await this.runRule('codeBlockLanguage', () => checkCodeBlockLanguage(docsDir, files)));
        }
        // Orphan Documents
        if (this.shouldRun('orphanDocuments')) {
            ruleResults.push(await this.runRule('orphanDocuments', () => checkOrphanDocuments(docsDir, files, this.config.exclude)));
        }
        // Terminology
        if (this.shouldRun('terminology') && this.config.terminology.length > 0) {
            ruleResults.push(await this.runRule('terminology', () => checkTerminology(docsDir, files, this.config.terminology)));
        }
        // Bidirectional References
        if (this.shouldRun('bidirectionalRefs')) {
            ruleResults.push(await this.runRule('bidirectionalRefs', () => checkBidirectionalRefs(docsDir, files)));
        }
        // i18n Structure (language suffix convention)
        if (this.shouldRun('i18nStructure')) {
            ruleResults.push(await this.runRule('i18nStructure', () => checkI18nStructure(docsDir, files, this.config.i18n)));
        }
        // Standards Drift (check if dev standards match templates)
        if (this.shouldRun('standardsDrift')) {
            const templatesDir = this.getTemplatesDir();
            if (templatesDir) {
                ruleResults.push(await this.runRule('standardsDrift', () => checkStandardsDrift(docsDir, templatesDir, this.config.rules.standardsDrift)));
            }
        }
        // Required Files
        if (this.config.requiredFiles.length > 0) {
            ruleResults.push(await this.runRule('requiredFiles', () => checkRequiredFiles(docsDir, this.config.requiredFiles)));
        }
        // Standard Folder Structure (G.U.Corp standard)
        if (this.shouldRun('standardFolderStructure')) {
            ruleResults.push(await this.runRule('standardFolderStructure', () => checkStandardFolderStructure(docsDir)));
        }
        // Folder Numbering
        if (this.shouldRun('folderNumbering')) {
            ruleResults.push(await this.runRule('folderNumbering', () => checkFolderNumbering(docsDir, this.config.rules.folderNumbering)));
        }
        // File Naming
        if (this.shouldRun('fileNaming')) {
            ruleResults.push(await this.runRule('fileNaming', () => checkFileNaming(docsDir, files, { upperCase: false })));
        }
        // Standard File Names
        if (this.shouldRun('standardFileNames')) {
            ruleResults.push(await this.runRule('standardFileNames', () => checkStandardFileNames(docsDir, files, this.config.rules.standardFileNames)));
        }
        // Requirement Test Mapping
        if (this.shouldRun('requirementTestMapping')) {
            ruleResults.push(await this.runRule('requirementTestMapping', () => checkRequirementTestMapping(docsDir, files, this.config.rules.requirementTestMapping)));
        }
        // markdownlint (Markdown syntax/formatting checks)
        if (this.shouldRun('markdownLint')) {
            ruleResults.push(await this.runRule('markdownLint', () => checkMarkdownLint(docsDir, files, this.config.rules.markdownLint)));
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
    async lintStructure(structureConfig) {
        const docsDir = path.resolve(this.config.docsDir);
        const files = await this.getFiles(docsDir);
        const results = [];
        // Folder structure
        results.push(await this.runRule('folderStructure', () => checkFolderStructure(docsDir, structureConfig)));
        // Folder numbering
        if (structureConfig.numberedFolders) {
            results.push(await this.runRule('folderNumbering', () => checkFolderNumbering(docsDir, this.config.rules.folderNumbering)));
        }
        // File naming
        results.push(await this.runRule('fileNaming', () => checkFileNaming(docsDir, files, { upperCase: structureConfig.upperCaseFiles })));
        // Duplicate content
        results.push(await this.runRule('duplicateContent', () => checkDuplicateContent(docsDir, files)));
        return results;
    }
    /**
     * Get all markdown files matching config patterns
     */
    async getFiles(docsDir) {
        const allFiles = [];
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
    shouldRun(ruleName) {
        // Check if rule is disabled in config
        const severity = this.config.rules[ruleName];
        if (severity === 'off')
            return false;
        // Check if rule is in skip list
        if (this.options.skip?.includes(ruleName))
            return false;
        // Check if only specific rules should run
        if (this.options.only && !this.options.only.includes(ruleName))
            return false;
        return true;
    }
    /**
     * Run a single rule and wrap in RuleResult
     */
    async runRule(ruleName, fn) {
        const severity = this.getRuleSeverity(ruleName);
        try {
            const issues = await fn();
            return {
                rule: ruleName,
                severity,
                issues,
                passed: issues.length === 0,
            };
        }
        catch (error) {
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
    getRuleSeverity(ruleName) {
        const config = this.config.rules[ruleName];
        if (typeof config === 'object' && 'severity' in config) {
            return config.severity;
        }
        return config || 'warn';
    }
    /**
     * Get the templates directory path
     * Returns null if templates are not available (e.g., when used as library)
     */
    getTemplatesDir() {
        // Templates are in ../templates relative to dist/linter.js
        const templatesPath = path.join(__dirname, '..', 'templates');
        if (fs.existsSync(templatesPath)) {
            return templatesPath;
        }
        return null;
    }
}
/**
 * Create a linter with configuration
 */
export function createLinter(config, options) {
    const mergedConfig = {
        ...defaultConfig,
        ...config,
        rules: {
            ...defaultConfig.rules,
            ...config.rules,
        },
    };
    return new DocsLinter(mergedConfig, options);
}
//# sourceMappingURL=linter.js.map