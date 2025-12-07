/**
 * CLI output formatters for docs-lint
 */
import chalk from 'chalk';
/**
 * Print lint results in human-readable format
 */
export function printResults(result, verbose) {
    console.log(chalk.bold('\n📄 Documentation Lint Results\n'));
    console.log(`Files checked: ${result.filesChecked}`);
    console.log(`Status: ${result.passed ? chalk.green('PASSED') : chalk.red('FAILED')}\n`);
    console.log(chalk.bold('Summary:'));
    console.log(`  ${chalk.red('Errors:')} ${result.summary.errors}`);
    console.log(`  ${chalk.yellow('Warnings:')} ${result.summary.warnings}`);
    console.log(`  ${chalk.green('Passed:')} ${result.summary.passed}\n`);
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
/**
 * Print code check results
 */
export function printCodeCheckResults(result, verbose) {
    console.log(chalk.bold('\n🔍 Code Check Results\n'));
    console.log(`Source files: ${result.sourceFilesChecked}`);
    console.log(`Test files: ${result.testFilesFound}`);
    console.log(`Test coverage: ${chalk.cyan(result.summary.coverage.percentage + '%')} (${result.summary.coverage.testedFiles}/${result.summary.coverage.sourceFiles})`);
    console.log(`Status: ${result.passed ? chalk.green('PASSED') : chalk.red('FAILED')}\n`);
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
        const label = rule.severity === 'error'
            ? chalk.red(rule.rule)
            : rule.severity === 'warn'
                ? chalk.yellow(rule.rule)
                : rule.rule;
        if (rule.issues.length === 0) {
            if (verbose) {
                console.log(`${icon} ${label}`);
            }
        }
        else {
            console.log(`${icon} ${label} (${rule.issues.length} issues)`);
            if (verbose) {
                for (const issue of rule.issues) {
                    console.log(`    ${chalk.gray(issue.file)} ${issue.message}`);
                    if (issue.suggestion) {
                        console.log(`      ${chalk.blue('→')} ${issue.suggestion}`);
                    }
                }
            }
            else {
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
export function printCoverageReport(report, verbose) {
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
    }
    else {
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
export function getProgressBar(percentage) {
    const width = 20;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}
/**
 * Print spec review report
 */
export function printSpecReviewReport(report, verbose) {
    console.log(chalk.bold('📋 Specification Review Report\n'));
    console.log(`Documents reviewed: ${report.totalDocuments}`);
    console.log(`Quality score: ${getQualityColor(report.qualityScore)}${report.qualityScore}%${chalk.reset()}`);
    console.log(`Documents without issues: ${chalk.green(report.passedDocuments)}/${report.totalDocuments}`);
    if (report.summary) {
        console.log(chalk.bold('\n📝 Summary:'));
        console.log(`  ${report.summary}`);
    }
    if (Object.keys(report.byCategory).length > 0) {
        console.log(chalk.bold('\nIssues by category:'));
        for (const [cat, stats] of Object.entries(report.byCategory)) {
            const icon = getCategoryIcon(cat);
            const errStr = stats.errors > 0 ? chalk.red(`${stats.errors} errors`) : '';
            const warnStr = stats.warnings > 0 ? chalk.yellow(`${stats.warnings} warnings`) : '';
            const parts = [errStr, warnStr].filter(Boolean).join(', ');
            console.log(`  ${icon} ${cat}: ${stats.total} issues (${parts || 'info only'})`);
        }
    }
    const errors = report.issues.filter(i => i.severity === 'error');
    const warnings = report.issues.filter(i => i.severity === 'warning');
    if (errors.length > 0) {
        console.log(chalk.bold('\n❌ Errors:'));
        for (const issue of verbose ? errors : errors.slice(0, 5)) {
            const loc = issue.line ? `${issue.file}:${issue.line}` : issue.file;
            console.log(`  ${chalk.red('✗')} ${chalk.gray(loc)}`);
            console.log(`    ${issue.message}`);
            if (issue.suggestion) {
                console.log(`    ${chalk.blue('→')} ${issue.suggestion}`);
            }
        }
        if (!verbose && errors.length > 5) {
            console.log(`  ${chalk.gray(`... and ${errors.length - 5} more errors`)}`);
        }
    }
    if (warnings.length > 0) {
        console.log(chalk.bold('\n⚠️ Warnings:'));
        for (const issue of verbose ? warnings : warnings.slice(0, 5)) {
            const loc = issue.line ? `${issue.file}:${issue.line}` : issue.file;
            console.log(`  ${chalk.yellow('⚠')} ${chalk.gray(loc)}`);
            console.log(`    ${issue.message}`);
            if (verbose && issue.suggestion) {
                console.log(`    ${chalk.blue('→')} ${issue.suggestion}`);
            }
        }
        if (!verbose && warnings.length > 5) {
            console.log(`  ${chalk.gray(`... and ${warnings.length - 5} more warnings`)}`);
        }
    }
    if (report.recommendations.length > 0) {
        console.log(chalk.bold('\n💡 Recommendations:'));
        for (const rec of report.recommendations.slice(0, 5)) {
            console.log(`  • ${rec}`);
        }
    }
    console.log('');
}
/**
 * Get color based on quality score
 */
function getQualityColor(score) {
    if (score >= 80)
        return chalk.green('');
    if (score >= 60)
        return chalk.yellow('');
    return chalk.red('');
}
/**
 * Get icon for issue category
 */
function getCategoryIcon(category) {
    switch (category) {
        case 'structure': return '🏗️';
        case 'terminology': return '📝';
        case 'consistency': return '🔄';
        case 'completeness': return '✅';
        case 'reference': return '🔗';
        default: return '📌';
    }
}
//# sourceMappingURL=formatters.js.map