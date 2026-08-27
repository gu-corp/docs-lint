import fs from 'fs';
import path from 'path';
import { DEFAULT_CONFIG, normalizeConfig } from '../core/config.js';
const CONFIG_FILENAME = 'docs-lint.config.json';
const DOCS_CONFIG_FILENAME = 'lunascape-docs.json';
const CONFIG_KEYS = new Set(['$schema', 'schemaVersion', 'root', 'include', 'exclude', 'standard', 'rules', 'terminology', 'traceability']);
export function loadConfig(options = {}) {
    const cwd = path.resolve(options.cwd || process.cwd());
    const configPath = options.configPath ? path.resolve(cwd, options.configPath) : findUp(cwd, CONFIG_FILENAME);
    let value = {};
    let configDirectory = cwd;
    if (configPath) {
        configDirectory = path.dirname(configPath);
        const parsed = readJson(configPath);
        if (!isRecord(parsed))
            throw new Error(`docs-lint configuration must be a JSON object: ${configPath}`);
        if (parsed.schemaVersion !== 3) {
            throw new Error(`docs-lint v3 requires schemaVersion: 3 in ${configPath}. Run docs-lint migrate.`);
        }
        if ('docsDir' in parsed)
            throw new Error('docsDir was replaced by root in docs-lint v3. Run docs-lint migrate.');
        validateConfigShape(parsed);
        value = parsed;
    }
    if (options.root)
        value.root = options.root;
    const normalized = normalizeConfig(value);
    const rootPath = path.resolve(configDirectory, normalized.root || DEFAULT_CONFIG.root);
    const standard = normalized.standard || readLunascapeStandard(rootPath);
    return {
        ...normalized,
        ...(standard ? { standard } : {}),
        configPath,
        configDirectory,
        rootPath,
    };
}
export function writeDefaultConfig(targetPath, root = './docs', standard) {
    const config = normalizeConfig({ schemaVersion: 3, root, ...(standard ? { standard } : {}) });
    fs.writeFileSync(targetPath, `${JSON.stringify(config, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
}
function readLunascapeStandard(rootPath) {
    const configPath = path.join(rootPath, DOCS_CONFIG_FILENAME);
    if (!fs.existsSync(configPath))
        return undefined;
    const value = readJson(configPath);
    if (!isRecord(value) || !isRecord(value.documentStandards))
        return undefined;
    const source = value.documentStandards.pack;
    const profile = value.documentStandards.profile;
    if (source === undefined)
        return undefined;
    if (typeof source !== 'string' || !source.trim())
        throw new Error(`${configPath}: documentStandards.pack must be a non-empty string.`);
    if (profile !== undefined && (typeof profile !== 'string' || !profile.trim()))
        throw new Error(`${configPath}: documentStandards.profile must be a non-empty string.`);
    const pack = source.startsWith('builtin:') || (!path.isAbsolute(source) && /^[a-z][a-z0-9+.-]*:/i.test(source))
        ? source
        : path.resolve(rootPath, source);
    return { pack, profile: typeof profile === 'string' ? profile : undefined };
}
function validateConfigShape(value) {
    const unknown = Object.keys(value).filter(key => !CONFIG_KEYS.has(key));
    if (unknown.length)
        throw new Error(`Unknown docs-lint v3 configuration properties: ${unknown.join(', ')}`);
    if (typeof value.root !== 'string' || !value.root.trim())
        throw new Error('root must be a non-empty string.');
    for (const key of ['include', 'exclude']) {
        if (value[key] !== undefined && (!Array.isArray(value[key]) || value[key].some(item => typeof item !== 'string'))) {
            throw new Error(`${key} must be an array of strings.`);
        }
    }
    if (value.standard !== undefined) {
        if (!isRecord(value.standard) || typeof value.standard.pack !== 'string' || !value.standard.pack.trim())
            throw new Error('standard.pack must be a non-empty string.');
        if (value.standard.profile !== undefined && (typeof value.standard.profile !== 'string' || !value.standard.profile.trim()))
            throw new Error('standard.profile must be a non-empty string.');
    }
    if (value.rules !== undefined && !isRecord(value.rules))
        throw new Error('rules must be an object.');
    if (value.terminology !== undefined && !Array.isArray(value.terminology))
        throw new Error('terminology must be an array.');
    if (value.traceability !== undefined) {
        if (!isRecord(value.traceability))
            throw new Error('traceability must be an object.');
        const coverage = value.traceability.requiredCoverage;
        if (coverage !== undefined && (typeof coverage !== 'number' || coverage < 0 || coverage > 1))
            throw new Error('traceability.requiredCoverage must be between 0 and 1.');
    }
}
function readJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    catch (error) {
        throw new Error(`Invalid JSON in ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function findUp(start, fileName) {
    let directory = start;
    while (true) {
        const candidate = path.join(directory, fileName);
        if (fs.existsSync(candidate))
            return candidate;
        const parent = path.dirname(directory);
        if (parent === directory)
            return undefined;
        directory = parent;
    }
}
function isRecord(value) {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
//# sourceMappingURL=config.js.map