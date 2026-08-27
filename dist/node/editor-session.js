import fs from 'node:fs';
import path from 'node:path';
import { isRuleSetting, optionsOf, severityOf } from '../core/config.js';
import { BUILTIN_RULES } from '../core/engine.js';
import { loadConfig } from './config.js';
import { lintWorkspace } from './run.js';
import { loadConfiguredStandard, renderTemplate as renderStandardTemplate, } from './standard-pack.js';
const CONFIG_FILENAME = 'docs-lint.config.json';
/**
 * Creates the filesystem-backed API used by editor hosts.
 *
 * Configuration is discovered from docsRoot upwards, but never above workspaceRoot.
 * A discovered configuration contributes every setting except its root: the caller's
 * docsRoot is always authoritative for document reads and lint results.
 */
export function createNodeDocsLintSession(options) {
    const { workspaceRoot, docsRoot } = resolveSessionRoots(options);
    const configPath = resolveSessionConfigPath(options, workspaceRoot, docsRoot);
    const config = loadSessionConfig(docsRoot, configPath);
    assertLocalStandardWithinWorkspace(workspaceRoot, config);
    const standard = loadConfiguredStandard(config);
    return {
        lint(runOptions = {}) {
            return lintWorkspace(config, runOptions, standard);
        },
        describe() {
            const templates = describeTemplates(standard.standardPack, standard.standardProfile);
            return {
                schemaVersion: 1,
                config: {
                    source: config.configPath ? 'docs-lint' : 'defaults',
                    ...(config.configPath ? { file: config.configPath } : {}),
                    directory: config.configDirectory,
                    root: config.rootPath,
                },
                ...describeStandard(standard.standardPack, standard.standardProfile),
                rules: describeRules(config, standard.standardPack, standard.standardProfile),
                templates,
            };
        },
        listTemplates() {
            return describeTemplates(standard.standardPack, standard.standardProfile);
        },
        renderTemplate(templateId, variables = {}) {
            if (!standard.standardPack || !standard.standardProfile) {
                throw new Error('No Standard Pack is configured for this documentation root.');
            }
            return renderStandardTemplate(standard.standardPack, standard.standardProfile, templateId, variables);
        },
    };
}
function resolveSessionRoots(options) {
    const workspaceValue = nonEmptyPath(options.workspaceRoot, 'workspaceRoot');
    const docsValue = nonEmptyPath(options.docsRoot, 'docsRoot');
    const workspaceRoot = path.resolve(workspaceValue);
    const docsRoot = path.isAbsolute(docsValue) ? path.resolve(docsValue) : path.resolve(workspaceRoot, docsValue);
    assertDirectory(workspaceRoot, 'Workspace root');
    assertPathWithin(workspaceRoot, docsRoot, 'docsRoot');
    assertDirectory(docsRoot, 'Documentation root');
    return { workspaceRoot, docsRoot };
}
function resolveSessionConfigPath(options, workspaceRoot, docsRoot) {
    if (options.configPath !== undefined) {
        const value = nonEmptyPath(options.configPath, 'configPath');
        const configPath = path.isAbsolute(value) ? path.resolve(value) : path.resolve(workspaceRoot, value);
        assertPathWithin(workspaceRoot, configPath, 'configPath');
        if (!fs.existsSync(configPath) || !fs.statSync(configPath).isFile()) {
            throw new Error(`docs-lint configuration was not found: ${configPath}`);
        }
        return configPath;
    }
    let directory = docsRoot;
    while (true) {
        const candidate = path.join(directory, CONFIG_FILENAME);
        if (fs.existsSync(candidate)) {
            assertPathWithin(workspaceRoot, candidate, 'configPath');
            if (!fs.statSync(candidate).isFile())
                throw new Error(`docs-lint configuration is not a file: ${candidate}`);
            return candidate;
        }
        if (directory === workspaceRoot)
            return undefined;
        const parent = path.dirname(directory);
        if (parent === directory)
            return undefined;
        directory = parent;
    }
}
function assertLocalStandardWithinWorkspace(workspaceRoot, config) {
    const source = config.standard?.pack;
    if (!source || source.startsWith('builtin:'))
        return;
    if (!path.isAbsolute(source) && /^[a-z][a-z0-9+.-]*:/i.test(source))
        return;
    const candidate = path.isAbsolute(source) ? path.resolve(source) : path.resolve(config.configDirectory, source);
    assertPathWithin(workspaceRoot, candidate, 'standard.pack');
}
function loadSessionConfig(docsRoot, configPath) {
    if (!configPath)
        return loadConfig({ cwd: docsRoot, root: '.', search: false });
    const configDirectory = path.dirname(configPath);
    const forcedRoot = toPosix(path.relative(configDirectory, docsRoot)) || '.';
    const config = loadConfig({ cwd: configDirectory, configPath, root: forcedRoot, search: false });
    // Guard against platform/path-normalisation differences: the requested root is authoritative.
    if (path.resolve(config.rootPath) !== docsRoot) {
        throw new Error(`Failed to bind docs-lint configuration to documentation root: ${docsRoot}`);
    }
    return config;
}
function describeRules(config, pack, profile) {
    return BUILTIN_RULES.map(rule => {
        const candidates = [
            { setting: config.rules[rule.id], source: 'config' },
            { setting: profile?.rules?.[rule.id], source: 'profile' },
            { setting: pack?.manifest.rules?.[rule.id], source: 'pack' },
        ];
        let setting;
        let source = 'default';
        for (const candidate of candidates) {
            if (!isRuleSetting(candidate.setting))
                continue;
            setting = candidate.setting;
            source = candidate.source;
            break;
        }
        const options = optionsOf(setting);
        return {
            id: rule.id,
            description: rule.description,
            severity: severityOf(setting, rule.defaultSeverity),
            source,
            ...(Object.keys(options).length ? { options: structuredClone(options) } : {}),
        };
    });
}
function describeStandard(pack, profile) {
    if (!pack || !profile)
        return {};
    return {
        standard: {
            id: pack.manifest.id,
            title: cloneLocalizedText(pack.manifest.title),
            ...(pack.manifest.description ? { description: cloneLocalizedText(pack.manifest.description) } : {}),
            version: pack.manifest.version,
            source: pack.manifestPath,
            profile: {
                id: profile.id,
                title: cloneLocalizedText(profile.title),
                ...(profile.description ? { description: cloneLocalizedText(profile.description) } : {}),
                inheritance: [...profile.inheritance],
            },
        },
    };
}
function describeTemplates(pack, profile) {
    if (!pack || !profile)
        return [];
    const enabled = profile.documentTypes || Object.keys(pack.manifest.documentTypes);
    return enabled.map(id => {
        const template = pack.manifest.documentTypes[id];
        if (!template)
            throw new Error(`Profile ${profile.id} references missing document type: ${id}`);
        return {
            id,
            title: cloneLocalizedText(template.title),
            ...(template.description ? { description: cloneLocalizedText(template.description) } : {}),
            ...(template.suggestedPath ? { suggestedPath: template.suggestedPath } : {}),
            variables: Object.fromEntries(Object.entries(template.variables || {}).map(([name, definition]) => [
                name,
                { ...definition },
            ])),
        };
    });
}
function cloneLocalizedText(value) {
    return typeof value === 'string' ? value : { ...value };
}
function nonEmptyPath(value, name) {
    if (typeof value !== 'string' || !value.trim())
        throw new Error(`${name} must be a non-empty path.`);
    return value;
}
function assertDirectory(candidate, label) {
    if (!fs.existsSync(candidate) || !fs.statSync(candidate).isDirectory()) {
        throw new Error(`${label} was not found: ${candidate}`);
    }
}
function assertPathWithin(root, candidate, label) {
    const relative = path.relative(root, candidate);
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
        throw new Error(`${label} must be inside workspaceRoot: ${candidate}`);
    }
    if (!fs.existsSync(candidate))
        return;
    const realRoot = fs.realpathSync(root);
    const realCandidate = fs.realpathSync(candidate);
    const realRelative = path.relative(realRoot, realCandidate);
    if (realRelative === '..' || realRelative.startsWith(`..${path.sep}`) || path.isAbsolute(realRelative)) {
        throw new Error(`${label} symlink must resolve inside workspaceRoot: ${candidate}`);
    }
}
function toPosix(value) {
    return value.split(path.sep).join('/');
}
//# sourceMappingURL=editor-session.js.map