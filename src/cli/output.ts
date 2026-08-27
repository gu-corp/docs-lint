import chalk from 'chalk';
import type { Diagnostic, LintReport } from '../core/types.js';

export function printReport(report: LintReport): void {
  console.log(chalk.bold(`\nChecked ${report.filesChecked} Markdown files\n`));
  for (const diagnostic of report.diagnostics) printDiagnostic(diagnostic);
  if (!report.diagnostics.length) console.log(chalk.green('✓ No diagnostics'));
  const summary = `${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.information} information`;
  console.log(`\n${report.passed ? chalk.green('PASS') : chalk.red('FAIL')} ${summary}`);
}

function printDiagnostic(diagnostic: Diagnostic): void {
  const level = diagnostic.severity === 'error' ? chalk.red('error')
    : diagnostic.severity === 'warning' ? chalk.yellow('warning') : chalk.blue('info');
  const location = diagnostic.file
    ? `${diagnostic.file}${diagnostic.location?.line ? `:${diagnostic.location.line}` : ''}`
    : '(workspace)';
  console.log(`${level} ${location} ${diagnostic.message} ${chalk.gray(`[${diagnostic.ruleId}]`)}`);
}
