import path from 'path';
import { loadConfig } from '../../node/config.js';
import { loadConfiguredStandard, renderTemplate } from '../../node/standard-pack.js';
import { writeDocument } from '../../node/workspace.js';
export function registerCreateCommand(program) {
    program.command('create <document-type>')
        .description('Create a Markdown document from the selected Standard Pack')
        .option('-c, --config <path>', 'Configuration file')
        .option('-o, --output <path>', 'Output path relative to the documentation root')
        .option('--var <assignment...>', 'Template variables as key=value')
        .option('--force', 'Overwrite an existing document', false)
        .action((documentTypeId, options) => {
        const config = loadConfig({ configPath: options.config });
        const { standardPack: pack, standardProfile: profile } = loadConfiguredStandard(config);
        if (!pack || !profile)
            throw new Error('No Standard Pack is configured.');
        const documentType = pack.manifest.documentTypes[documentTypeId];
        if (!documentType)
            throw new Error(`Document type does not exist: ${documentTypeId}`);
        const output = options.output || documentType.suggestedPath;
        if (!output)
            throw new Error('Output is required because this document type has no suggestedPath.');
        const content = renderTemplate(pack, profile, documentTypeId, assignments(options.var || []));
        const target = writeDocument(config.rootPath, output, content, options.force);
        console.log(`Created ${path.relative(process.cwd(), target)}`);
    });
}
function assignments(values) {
    const result = {};
    for (const value of values) {
        const index = value.indexOf('=');
        if (index <= 0)
            throw new Error(`Template variable must use key=value: ${value}`);
        result[value.slice(0, index)] = value.slice(index + 1);
    }
    return result;
}
//# sourceMappingURL=create.js.map