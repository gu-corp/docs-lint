import { listBundledPacks, loadStandardPack } from '../../node/standard-pack.js';
import { resolveStandardProfile } from '../../standards/manifest.js';
export function registerPackCommand(program) {
    const pack = program.command('pack').description('Inspect and validate document Standard Packs');
    pack.command('list').description('List bundled packs and profiles').option('--json').action(options => {
        const values = listBundledPacks().map(item => ({
            id: item.manifest.id,
            version: item.manifest.version,
            title: item.manifest.title,
            profiles: Object.keys(item.manifest.profiles),
            documentTypes: Object.keys(item.manifest.documentTypes),
        }));
        if (options.json)
            console.log(JSON.stringify(values, null, 2));
        else
            for (const item of values)
                console.log(`${item.id}@${item.version}\n  profiles: ${item.profiles.join(', ')}\n  document types: ${item.documentTypes.join(', ')}`);
    });
    pack.command('validate <source>').description('Validate a local pack manifest and templates').option('--json').action((source, options) => {
        const loaded = loadStandardPack(source);
        const result = { valid: true, id: loaded.manifest.id, version: loaded.manifest.version, profiles: Object.keys(loaded.manifest.profiles) };
        if (options.json)
            console.log(JSON.stringify(result, null, 2));
        else
            console.log(`Valid Standard Pack: ${result.id}@${result.version}`);
    });
    pack.command('show <source>').description('Show a resolved profile').option('--profile <id>').option('--json').action((source, options) => {
        const loaded = loadStandardPack(source);
        const profile = resolveStandardProfile(loaded.manifest, options.profile);
        const result = { pack: loaded.manifest, profile };
        if (options.json)
            console.log(JSON.stringify(result, null, 2));
        else
            console.log(JSON.stringify(result, null, 2));
    });
}
//# sourceMappingURL=pack.js.map