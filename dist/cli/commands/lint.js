import { loadConfig } from '../../node/config.js';
import { lintWorkspace } from '../../node/run.js';
import { printReport } from '../output.js';
export function registerLintCommand(program) {
    program.command('lint')
        .description('Validate documentation with the v3 rule engine and selected Standard Pack')
        .option('-c, --config <path>', 'Configuration file')
        .option('-r, --root <path>', 'Documentation root override')
        .option('--only <rules>', 'Comma-separated rule ids')
        .option('--skip <rules>', 'Comma-separated rule ids')
        .option('--json', 'Print the stable JSON report')
        .action(async (options) => {
        const config = loadConfig({ configPath: options.config, root: options.root });
        const report = await lintWorkspace(config, {
            only: split(options.only),
            skip: split(options.skip),
        });
        if (options.json)
            console.log(JSON.stringify(report, null, 2));
        else
            printReport(report);
        process.exitCode = report.passed ? 0 : 1;
    });
}
function split(value) {
    return value?.split(',').map(item => item.trim()).filter(Boolean);
}
//# sourceMappingURL=lint.js.map