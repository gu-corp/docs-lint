import { Minimatch } from 'minimatch';
// Generic defaults. Organisation-specific prefixes, folders and test case
// categories belong in a Standard Pack's rule options, not here.
const DEFAULT_REQUIREMENT_PREFIXES = ['BR', 'FR', 'SR', 'NFR'];
const DEFAULT_TEST_CASE_PATTERN = '\\bTC-[A-Z0-9]+(?:-[0-9]+)?\\b';
const DEFAULT_DEFERRED_TEST_CASE_PATTERN = '\\bTC-D[0-9][0-9A-Z-]*\\b';
const DEFAULT_EXCLUDED_TEST_CASE_PATTERN = '\\bTC-X[0-9][0-9A-Z-]*\\b';
const DEFAULT_REQUIREMENT_FILES = ['**/*REQUIREMENTS*.md', '**/01-requirements/**/*.md'];
const DEFAULT_TEST_FILES = ['**/*TEST*.md', '**/*-TESTS.md', '**/03-testing/**/*.md', '**/05-testing/**/*.md'];
export const requirementsTestsRule = {
    id: 'traceability/requirements-tests',
    description: 'Check that requirement IDs are referenced by test documents.',
    defaultSeverity: 'warning',
    run(context) {
        const setup = prepare(context);
        if (setup.requirementFiles.length === 0)
            return [];
        const diagnostics = [];
        const config = setup.config;
        if (config.requireRequirementIds !== false) {
            for (const document of setup.requirementFiles) {
                if (!hasMatch(maskCode(document.body), setup.requirementPattern)) {
                    diagnostics.push({ ruleId: '', severity: 'warning', file: document.path, location: { line: 1, column: 1 }, message: 'Requirement document has no requirement IDs.' });
                }
            }
        }
        if (setup.requirements.size === 0)
            return diagnostics;
        if (setup.testFiles.length === 0) {
            if (config.requireTestFile !== false) {
                diagnostics.push({ ruleId: '', severity: 'warning', message: 'Requirements exist but no test document was found.', data: { testFiles: config.testFiles || DEFAULT_TEST_FILES } });
            }
            return diagnostics;
        }
        if (config.requireTestCaseIds !== false) {
            for (const document of setup.testFiles) {
                if (!hasMatch(maskCode(document.body), setup.testPattern)) {
                    diagnostics.push({ ruleId: '', severity: 'warning', file: document.path, location: { line: 1, column: 1 }, message: 'Test document has no test case IDs.' });
                }
            }
        }
        const testLines = setup.testFiles.flatMap(document => maskCode(document.body).split(/\r?\n/));
        if (!testLines.some(line => hasMatch(line, setup.testPattern))) {
            diagnostics.push({ ruleId: '', severity: 'warning', message: 'Requirements exist but no test case IDs were found.' });
        }
        let covered = 0;
        let excluded = 0;
        for (const [id, definition] of setup.requirements) {
            const references = testLines.filter(line => line.includes(id));
            const status = classify(references, setup);
            if (status === 'covered') {
                covered += 1;
                continue;
            }
            if (status === 'excluded') {
                excluded += 1;
                continue;
            }
            if (status === 'deferred') {
                diagnostics.push({
                    ruleId: '', severity: 'info',
                    message: `Requirement is only covered by deferred test cases: ${id}`,
                    file: definition.file, location: definition.location,
                    data: { requirementId: id, status },
                });
                continue;
            }
            diagnostics.push({
                ruleId: '', severity: 'warning',
                message: `Requirement has no test reference: ${id}`,
                file: definition.file, location: definition.location,
                data: { requirementId: id, status },
            });
        }
        const requiredCoverage = config.requiredCoverage;
        const denominator = setup.requirements.size - excluded;
        const actualCoverage = denominator === 0 ? 1 : covered / denominator;
        if (requiredCoverage !== undefined && actualCoverage < requiredCoverage) {
            diagnostics.push({
                ruleId: '', severity: 'warning',
                message: `Requirement test coverage is ${(actualCoverage * 100).toFixed(1)}%; required ${(requiredCoverage * 100).toFixed(1)}%.`,
                data: { actualCoverage, requiredCoverage, requirements: setup.requirements.size, covered, excluded },
            });
        }
        return diagnostics;
    },
};
export const requirementIdsRule = {
    id: 'traceability/requirement-ids',
    description: 'Check that requirement IDs in requirement documents follow the configured pattern and are defined once.',
    defaultSeverity: 'warning',
    run(context) {
        const setup = prepare(context);
        if (setup.requirementFiles.length === 0)
            return [];
        const diagnostics = [];
        const loose = loosePattern(setup.prefixes);
        for (const document of setup.requirementFiles) {
            const masked = maskCode(document.body);
            for (const match of masked.matchAll(loose)) {
                if (isStrictMatch(match[0], setup.requirementPattern))
                    continue;
                diagnostics.push({
                    ruleId: '', severity: 'warning',
                    message: `Requirement ID does not follow the configured pattern: ${match[0]}`,
                    file: document.path, location: positionAt(document, match.index),
                    data: { candidate: match[0] },
                });
            }
        }
        if (setup.config.requireUniqueRequirementIds !== false) {
            const definitions = new Map();
            for (const document of setup.requirementFiles) {
                for (const occurrence of definitionOccurrences(document, setup.requirementPattern)) {
                    const id = occurrence.line.match(setup.requirementPattern)?.[0] ?? '';
                    const first = definitions.get(id);
                    if (!first) {
                        definitions.set(id, occurrence);
                        continue;
                    }
                    diagnostics.push({
                        ruleId: '', severity: 'warning',
                        message: `Requirement ID is defined more than once: ${id} (first defined in ${first.file}:${first.location.line})`,
                        file: occurrence.file, location: occurrence.location,
                        data: { requirementId: id, firstFile: first.file, firstLine: first.location.line },
                    });
                }
            }
        }
        return diagnostics;
    },
};
export const requirementReferencesRule = {
    id: 'traceability/requirement-references',
    description: 'Check that requirement IDs referenced outside requirement documents are defined in one.',
    defaultSeverity: 'warning',
    run(context) {
        const setup = prepare(context);
        if (setup.requirementFiles.length === 0)
            return [];
        const diagnostics = [];
        for (const document of [...setup.testFiles, ...setup.otherFiles]) {
            const masked = maskCode(document.body);
            const reported = new Set();
            for (const match of masked.matchAll(freshRegExp(setup.requirementPattern))) {
                const id = match[0];
                if (setup.requirements.has(id))
                    continue;
                // Report each undefined ID once per document, at its first mention.
                if (reported.has(id))
                    continue;
                reported.add(id);
                diagnostics.push({
                    ruleId: '', severity: 'warning',
                    message: `Referenced requirement is not defined in any requirement document: ${id}`,
                    file: document.path, location: positionAt(document, match.index),
                    data: { requirementId: id },
                });
            }
        }
        return diagnostics;
    },
};
function prepare(context) {
    const config = context.config.traceability || {};
    const prefixes = (config.requirementPrefixes && config.requirementPrefixes.length > 0
        ? config.requirementPrefixes
        : DEFAULT_REQUIREMENT_PREFIXES).map(prefix => prefix.toUpperCase());
    const requirementPattern = expression(config.requirementPattern || defaultRequirementPattern(prefixes), 'requirementPattern');
    const testPattern = expression(config.testCasePattern || DEFAULT_TEST_CASE_PATTERN, 'testCasePattern');
    const deferredPattern = expression(config.deferredTestCasePattern || DEFAULT_DEFERRED_TEST_CASE_PATTERN, 'deferredTestCasePattern');
    const excludedPattern = expression(config.excludedTestCasePattern || DEFAULT_EXCLUDED_TEST_CASE_PATTERN, 'excludedTestCasePattern');
    const requirementGlobs = config.requirementFiles || DEFAULT_REQUIREMENT_FILES;
    const testGlobs = config.testFiles || DEFAULT_TEST_FILES;
    const requirementFiles = context.documents.filter(document => matchesAny(document.path, requirementGlobs));
    const requirementPaths = new Set(requirementFiles.map(document => document.path));
    const testFiles = context.documents.filter(document => !requirementPaths.has(document.path) && matchesAny(document.path, testGlobs));
    const testPaths = new Set(testFiles.map(document => document.path));
    const otherFiles = context.documents.filter(document => !requirementPaths.has(document.path) && !testPaths.has(document.path));
    return {
        config,
        prefixes,
        requirementPattern,
        testPattern,
        deferredPattern,
        excludedPattern,
        requirementFiles,
        testFiles,
        otherFiles,
        requirements: locate(requirementFiles, requirementPattern),
    };
}
function defaultRequirementPattern(prefixes) {
    return `\\b(?:${prefixes.map(escapeRegExp).join('|')})-[A-Z0-9]+(?:-[0-9]+)?\\b`;
}
/** Candidates that look like a requirement ID but may be malformed: FR001, fr-001, FR_001, FR-doc-1. */
function loosePattern(prefixes) {
    const alternatives = prefixes.map(escapeRegExp).join('|');
    return new RegExp(`(?<![A-Za-z0-9])(?:${alternatives})[ _-]?(?:[A-Za-z0-9]+[ _-])*[0-9]+(?![A-Za-z0-9])`, 'gi');
}
function isStrictMatch(candidate, pattern) {
    const match = candidate.match(freshRegExp(pattern));
    return Boolean(match && match[0] === candidate);
}
function classify(references, setup) {
    if (references.length === 0)
        return 'uncovered';
    let deferred = false;
    let excluded = false;
    for (const line of references) {
        const testCases = line.match(freshRegExp(setup.testPattern)) || [];
        // A mention without any test case ID still counts as a reference, as it
        // did before test case categories were reintroduced.
        if (testCases.length === 0)
            return 'covered';
        let lineDeferred = false;
        let lineExcluded = false;
        for (const testCase of testCases) {
            if (hasMatch(testCase, setup.excludedPattern))
                lineExcluded = true;
            else if (hasMatch(testCase, setup.deferredPattern))
                lineDeferred = true;
            else
                return 'covered';
        }
        deferred ||= lineDeferred;
        excluded ||= lineExcluded;
    }
    if (deferred)
        return 'deferred';
    if (excluded)
        return 'excluded';
    return 'covered';
}
function expression(source, name) {
    try {
        return new RegExp(source, 'g');
    }
    catch (error) {
        throw new Error(`Invalid ${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function freshRegExp(regex) {
    return new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
}
function hasMatch(text, regex) {
    return new RegExp(regex.source, regex.flags.replace('g', '')).test(text);
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/** Blanks fenced code blocks and inline code so identifiers inside them are ignored without shifting offsets. */
function maskCode(body) {
    const blank = (match) => match.replace(/[^\n]/g, ' ');
    return body
        .replace(/^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1[ \t]*(?:\n|$)/gm, blank)
        .replace(/(`+)([^`\n]*?)\1/g, blank);
}
/** Records the first definition of every requirement ID, in document order. */
function locate(documents, regex) {
    const result = new Map();
    for (const document of documents) {
        const masked = maskCode(document.body);
        for (const match of masked.matchAll(freshRegExp(regex))) {
            if (result.has(match[0]))
                continue;
            result.set(match[0], occurrenceAt(document, match.index));
        }
    }
    return result;
}
/** IDs that start a table row or a heading are treated as definitions. */
function definitionOccurrences(document, regex) {
    const masked = maskCode(document.body);
    const result = [];
    let offset = 0;
    for (const line of masked.split(/\r?\n/)) {
        const definition = line.match(new RegExp(`^\\s*(?:\\|\\s*|#{1,6}\\s+)(${regex.source})`));
        if (definition) {
            const index = offset + line.indexOf(definition[1]);
            result.push(occurrenceAt(document, index));
        }
        offset += line.length + 1;
    }
    return result;
}
function occurrenceAt(document, index) {
    const line = document.body.slice(document.body.lastIndexOf('\n', index - 1) + 1, indexOfLineEnd(document.body, index));
    return { file: document.path, location: positionAt(document, index), line, index };
}
function indexOfLineEnd(text, index) {
    const end = text.indexOf('\n', index);
    return end < 0 ? text.length : end;
}
function positionAt(document, bodyIndex) {
    // Rules scan the body, but editors address lines of the whole file, so
    // positions must include any front matter that precedes the body.
    const source = document.content.endsWith(document.body) ? document.content : document.body;
    const index = bodyIndex + (source.length - document.body.length);
    const before = source.slice(0, index);
    const lineStart = before.lastIndexOf('\n') + 1;
    return { line: before.split(/\r?\n/).length, column: index - lineStart + 1 };
}
function matchesAny(file, patterns) {
    return patterns.some(pattern => new Minimatch(pattern, { nocase: true, dot: true }).match(file));
}
//# sourceMappingURL=traceability.js.map