import { Minimatch } from 'minimatch';
export const requirementsTestsRule = {
    id: 'traceability/requirements-tests',
    description: 'Check that requirement IDs are referenced by test documents.',
    defaultSeverity: 'warning',
    run(context) {
        const config = context.config.traceability || {};
        const requirementPattern = expression(config.requirementPattern || '\\b(?:BR|FR|SR)-[A-Z0-9]+(?:-[0-9]+)?\\b', 'requirementPattern');
        const testPattern = expression(config.testCasePattern || '\\bTC-[A-Z0-9]+(?:-[0-9]+)?\\b', 'testCasePattern');
        const requirementFiles = context.documents.filter(document => matchesAny(document.path, config.requirementFiles || ['**/*REQUIREMENTS*.md']));
        const testFiles = context.documents.filter(document => matchesAny(document.path, config.testFiles || ['**/*TEST*.md']));
        const requirements = collect(requirementFiles.map(file => file.body), requirementPattern);
        const testCases = collect(testFiles.map(file => file.body), testPattern);
        const testText = testFiles.map(file => file.body).join('\n');
        const covered = [...requirements].filter(id => testText.includes(id));
        const diagnostics = [];
        for (const id of requirements) {
            if (!testText.includes(id))
                diagnostics.push({ ruleId: '', severity: 'warning', message: `Requirement has no test reference: ${id}`, data: { requirementId: id } });
        }
        if (requirements.size > 0 && testCases.size === 0)
            diagnostics.push({ ruleId: '', severity: 'warning', message: 'Requirements exist but no test case IDs were found.' });
        const requiredCoverage = config.requiredCoverage;
        const actualCoverage = requirements.size === 0 ? 1 : covered.length / requirements.size;
        if (requiredCoverage !== undefined && actualCoverage < requiredCoverage) {
            diagnostics.push({
                ruleId: '', severity: 'warning',
                message: `Requirement test coverage is ${(actualCoverage * 100).toFixed(1)}%; required ${(requiredCoverage * 100).toFixed(1)}%.`,
                data: { actualCoverage, requiredCoverage, requirements: requirements.size, covered: covered.length },
            });
        }
        return diagnostics;
    },
};
function expression(source, name) {
    try {
        return new RegExp(source, 'g');
    }
    catch (error) {
        throw new Error(`Invalid ${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function collect(values, regex) {
    const result = new Set();
    for (const value of values)
        for (const match of value.matchAll(new RegExp(regex.source, regex.flags)))
            result.add(match[0]);
    return result;
}
function matchesAny(file, patterns) {
    return patterns.some(pattern => new Minimatch(pattern, { nocase: true, dot: true }).match(file));
}
//# sourceMappingURL=traceability.js.map