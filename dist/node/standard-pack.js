import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveStandardProfile, validateStandardPackManifest } from '../standards/manifest.js';
import { securePath } from './workspace.js';
const VARIABLE_PATTERN = /\{\{\s*([A-Za-z][A-Za-z0-9_.-]*)\s*\}\}/g;
export function loadConfiguredStandard(config) {
    if (!config.standard)
        return {};
    const source = resolvePackSource(config.standard.pack, config.configDirectory);
    const pack = loadStandardPack(source);
    return { standardPack: pack, standardProfile: resolveStandardProfile(pack.manifest, config.standard.profile) };
}
export function loadStandardPack(source) {
    const candidate = path.resolve(source);
    if (!fs.existsSync(candidate))
        throw new Error(`Standard pack source was not found: ${candidate}`);
    const manifestPath = fs.statSync(candidate).isDirectory() ? path.join(candidate, 'pack.json') : candidate;
    if (!fs.existsSync(manifestPath) || !fs.statSync(manifestPath).isFile()) {
        throw new Error(`Standard pack manifest was not found: ${manifestPath}`);
    }
    const rootPath = path.dirname(manifestPath);
    let manifest;
    try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }
    catch (error) {
        throw new Error(`Standard pack manifest is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
    const issues = validateStandardPackManifest(manifest);
    for (const [id, type] of Object.entries(manifest.documentTypes || {})) {
        try {
            securePackFile(rootPath, type.template);
        }
        catch (error) {
            issues.push(`Document type ${id}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    if (issues.length)
        throw new Error(`Standard pack is invalid:\n- ${issues.join('\n- ')}`);
    return { rootPath, manifestPath, manifest };
}
export function renderTemplate(pack, profile, documentTypeId, supplied = {}) {
    const documentType = pack.manifest.documentTypes[documentTypeId];
    if (!documentType)
        throw new Error(`Document type does not exist: ${documentTypeId}`);
    if (profile.documentTypes?.length && !profile.documentTypes.includes(documentTypeId)) {
        throw new Error(`Document type ${documentTypeId} is not enabled by profile ${profile.id}.`);
    }
    const variables = {
        date: new Date().toISOString().slice(0, 10),
        packId: pack.manifest.id,
        packVersion: pack.manifest.version,
        canonicalLocale: documentType.canonicalLocale || 'ja',
        ...profile.variables,
    };
    for (const [name, definition] of Object.entries(documentType.variables || {})) {
        if (definition.default !== undefined)
            variables[name] = definition.default;
    }
    Object.assign(variables, supplied);
    const missing = Object.entries(documentType.variables || {})
        .filter(([name, definition]) => definition.required && !variables[name]?.trim())
        .map(([name]) => name);
    if (missing.length)
        throw new Error(`Required template variables are missing: ${missing.join(', ')}`);
    const unresolved = new Set();
    const template = fs.readFileSync(securePackFile(pack.rootPath, documentType.template), 'utf8');
    const rendered = template.replace(VARIABLE_PATTERN, (_match, name) => {
        if (variables[name] === undefined) {
            unresolved.add(name);
            return `{{${name}}}`;
        }
        return variables[name];
    });
    if (unresolved.size)
        throw new Error(`Template variables are unresolved: ${[...unresolved].join(', ')}`);
    return rendered;
}
export function bundledPacksRoot() {
    return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'packs');
}
export function listBundledPacks() {
    const root = bundledPacksRoot();
    if (!fs.existsSync(root))
        return [];
    return fs.readdirSync(root, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && fs.existsSync(path.join(root, entry.name, 'pack.json')))
        .map(entry => loadStandardPack(path.join(root, entry.name)));
}
function resolvePackSource(source, configDirectory) {
    if (source.startsWith('builtin:'))
        return path.join(bundledPacksRoot(), source.slice('builtin:'.length));
    if (!path.isAbsolute(source) && /^[a-z][a-z0-9+.-]*:/i.test(source))
        throw new Error(`Unsupported standard pack source: ${source}. v3 accepts builtin: or local paths.`);
    return path.resolve(configDirectory, source);
}
function securePackFile(rootPath, relativePath) {
    const candidate = securePath(rootPath, relativePath, false);
    if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile())
        throw new Error(`Pack file does not exist: ${relativePath}`);
    const root = fs.realpathSync(rootPath);
    const real = fs.realpathSync(candidate);
    const relative = path.relative(root, real);
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
        throw new Error(`Pack file symlink escapes the pack root: ${relativePath}`);
    }
    return real;
}
//# sourceMappingURL=standard-pack.js.map