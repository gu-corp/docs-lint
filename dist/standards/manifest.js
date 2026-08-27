const ID_PATTERN = /^[a-z0-9][a-z0-9._/-]*$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const SEVERITIES = new Set(['off', 'info', 'warning', 'error']);
export function validateStandardPackManifest(value) {
    const issues = [];
    if (!isRecord(value))
        return ['Manifest must be a JSON object.'];
    const pack = value;
    if (pack.schemaVersion !== 1)
        issues.push('schemaVersion must be 1.');
    if (typeof pack.id !== 'string' || !ID_PATTERN.test(pack.id))
        issues.push('id must use lowercase URL-safe segments.');
    if (typeof pack.version !== 'string' || !VERSION_PATTERN.test(pack.version))
        issues.push('version must use semantic versioning.');
    if (!isLocalizedText(pack.title))
        issues.push('title must be a string or locale map.');
    if (pack.description !== undefined && !isLocalizedText(pack.description))
        issues.push('description must be a string or locale map.');
    if (!isRecord(pack.profiles) || Object.keys(pack.profiles).length === 0)
        issues.push('profiles must be a non-empty object.');
    if (!isRecord(pack.documentTypes) || Object.keys(pack.documentTypes).length === 0) {
        issues.push('documentTypes must be a non-empty object.');
        return issues;
    }
    const profiles = isRecord(pack.profiles) ? pack.profiles : {};
    const documentTypes = pack.documentTypes;
    if (pack.defaultProfile !== undefined && (typeof pack.defaultProfile !== 'string' || !profiles[pack.defaultProfile])) {
        issues.push(`defaultProfile does not exist: ${String(pack.defaultProfile)}`);
    }
    validateRules('Pack', pack.rules, issues);
    for (const [profileId, candidate] of Object.entries(profiles)) {
        if (!ID_PATTERN.test(profileId))
            issues.push(`Invalid profile id: ${profileId}`);
        if (!isRecord(candidate)) {
            issues.push(`Profile ${profileId} must be an object.`);
            continue;
        }
        const profile = candidate;
        if (!isLocalizedText(profile.title))
            issues.push(`Profile ${profileId} requires a title.`);
        const parents = stringArray(profile.extends, `Profile ${profileId}.extends`, issues);
        const enabled = stringArray(profile.documentTypes, `Profile ${profileId}.documentTypes`, issues);
        const required = stringArray(profile.requiredDocuments, `Profile ${profileId}.requiredDocuments`, issues);
        for (const parent of parents)
            if (!profiles[parent])
                issues.push(`Profile ${profileId} extends missing profile: ${parent}`);
        for (const type of [...enabled, ...required])
            if (!documentTypes[type])
                issues.push(`Profile ${profileId} references missing document type: ${type}`);
        if (profile.variables !== undefined && (!isRecord(profile.variables) || Object.values(profile.variables).some(item => typeof item !== 'string'))) {
            issues.push(`Profile ${profileId}.variables must contain string values.`);
        }
        validateRules(`Profile ${profileId}`, profile.rules, issues);
    }
    detectCycles(profiles, issues);
    for (const [id, candidate] of Object.entries(documentTypes)) {
        if (!ID_PATTERN.test(id))
            issues.push(`Invalid document type id: ${id}`);
        if (!isRecord(candidate)) {
            issues.push(`Document type ${id} must be an object.`);
            continue;
        }
        const documentType = candidate;
        if (!isLocalizedText(documentType.title))
            issues.push(`Document type ${id} requires a title.`);
        if (typeof documentType.template !== 'string' || !isSafeRelativePath(documentType.template)) {
            issues.push(`Document type ${id}.template must be a safe relative path.`);
        }
        if (documentType.suggestedPath !== undefined && (typeof documentType.suggestedPath !== 'string' || !isSafeRelativePath(documentType.suggestedPath))) {
            issues.push(`Document type ${id}.suggestedPath must be a safe relative path.`);
        }
        if (documentType.variables !== undefined)
            validateVariables(id, documentType.variables, issues);
        if (documentType.sections !== undefined)
            validateSections(id, documentType.sections, issues);
    }
    if (pack.structure !== undefined) {
        if (!Array.isArray(pack.structure))
            issues.push('structure must be an array.');
        else
            for (const [index, folder] of pack.structure.entries()) {
                if (!isRecord(folder) || typeof folder.path !== 'string' || !isSafeRelativePath(folder.path)) {
                    issues.push(`structure[${index}].path must be a safe relative path.`);
                }
            }
    }
    if (pack.terminology !== undefined)
        validateTerminology(pack.terminology, issues);
    return issues;
}
export function resolveStandardProfile(pack, profileId) {
    const id = profileId || pack.defaultProfile || Object.keys(pack.profiles)[0];
    if (!id || !pack.profiles[id])
        throw new Error(`Standard profile does not exist: ${id || '(none)'}`);
    const visiting = new Set();
    const inheritance = [];
    function visit(currentId) {
        if (visiting.has(currentId))
            throw new Error(`Standard profile inheritance cycle: ${[...visiting, currentId].join(' -> ')}`);
        const current = pack.profiles[currentId];
        if (!current)
            throw new Error(`Standard profile does not exist: ${currentId}`);
        visiting.add(currentId);
        let merged = { title: current.title };
        for (const parent of current.extends || [])
            merged = mergeProfile(merged, visit(parent));
        visiting.delete(currentId);
        inheritance.push(currentId);
        return mergeProfile(merged, current);
    }
    return { ...visit(id), id, inheritance: [...new Set(inheritance)] };
}
function mergeProfile(base, override) {
    return {
        ...base,
        ...override,
        extends: unique([...(base.extends || []), ...(override.extends || [])]),
        documentTypes: unique([...(base.documentTypes || []), ...(override.documentTypes || [])]),
        requiredDocuments: unique([...(base.requiredDocuments || []), ...(override.requiredDocuments || [])]),
        variables: { ...base.variables, ...override.variables },
        rules: { ...base.rules, ...override.rules },
    };
}
function detectCycles(profiles, issues) {
    const done = new Set();
    const active = new Set();
    function visit(id, path) {
        if (active.has(id)) {
            issues.push(`Profile inheritance cycle: ${[...path, id].join(' -> ')}`);
            return;
        }
        if (done.has(id) || !profiles[id])
            return;
        active.add(id);
        for (const parent of Array.isArray(profiles[id].extends) ? profiles[id].extends : [])
            visit(parent, [...path, id]);
        active.delete(id);
        done.add(id);
    }
    for (const id of Object.keys(profiles))
        visit(id, []);
}
function validateRules(owner, value, issues) {
    if (value === undefined)
        return;
    if (!isRecord(value)) {
        issues.push(`${owner}.rules must be an object.`);
        return;
    }
    for (const [id, setting] of Object.entries(value)) {
        if (!id.includes('/'))
            issues.push(`${owner}.rules contains a non-namespaced rule: ${id}`);
        const severity = typeof setting === 'string' ? setting : isRecord(setting) ? setting.severity : undefined;
        if (typeof severity !== 'string' || !SEVERITIES.has(severity))
            issues.push(`${owner}.rules.${id} has an invalid severity.`);
    }
}
function validateVariables(id, value, issues) {
    if (!isRecord(value)) {
        issues.push(`Document type ${id}.variables must be an object.`);
        return;
    }
    for (const [name, variable] of Object.entries(value)) {
        if (!/^[A-Za-z][A-Za-z0-9_.-]*$/.test(name) || !isRecord(variable))
            issues.push(`Document type ${id} has an invalid variable: ${name}`);
        else if (variable.default !== undefined && typeof variable.default !== 'string')
            issues.push(`Document type ${id}.variables.${name}.default must be a string.`);
    }
}
function validateSections(id, value, issues) {
    if (!Array.isArray(value)) {
        issues.push(`Document type ${id}.sections must be an array.`);
        return;
    }
    const sectionIds = new Set();
    for (const [index, section] of value.entries()) {
        if (!isRecord(section) || typeof section.id !== 'string' || !section.id) {
            issues.push(`Document type ${id}.sections[${index}] requires an id.`);
            continue;
        }
        if (sectionIds.has(section.id))
            issues.push(`Document type ${id} has duplicate section id: ${section.id}`);
        sectionIds.add(section.id);
        if (!isLocalizedText(section.title))
            issues.push(`Document type ${id}.sections.${section.id} requires a title.`);
        if (section.level !== undefined && (!Number.isInteger(section.level) || section.level < 1 || section.level > 6)) {
            issues.push(`Document type ${id}.sections.${section.id}.level must be 1-6.`);
        }
    }
}
function validateTerminology(value, issues) {
    if (!Array.isArray(value)) {
        issues.push('terminology must be an array.');
        return;
    }
    for (const [index, term] of value.entries()) {
        if (!isRecord(term) || typeof term.preferred !== 'string' || !term.preferred.trim())
            issues.push(`terminology[${index}].preferred is required.`);
        if (!isRecord(term) || !Array.isArray(term.variants) || term.variants.length === 0 || term.variants.some(item => typeof item !== 'string' || !item)) {
            issues.push(`terminology[${index}].variants must be a non-empty string array.`);
        }
    }
}
function stringArray(value, label, issues) {
    if (value === undefined)
        return [];
    if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
        issues.push(`${label} must be a string array.`);
        return [];
    }
    return value;
}
function isSafeRelativePath(value) {
    if (!value || value.includes('\\') || value.startsWith('/') || /^[A-Za-z]:/.test(value))
        return false;
    const segments = value.split('/');
    return !segments.some(segment => segment === '..' || segment === '.' || segment === '');
}
function isRecord(value) {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
function isLocalizedText(value) {
    return typeof value === 'string' ? Boolean(value.trim()) : isRecord(value)
        && Object.values(value).length > 0
        && Object.values(value).every(item => typeof item === 'string' && item.trim());
}
function unique(values) { return [...new Set(values)]; }
//# sourceMappingURL=manifest.js.map