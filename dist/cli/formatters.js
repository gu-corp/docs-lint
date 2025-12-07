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
//# sourceMappingURL=formatters.js.map