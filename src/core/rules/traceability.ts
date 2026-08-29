import { Minimatch } from 'minimatch';
import type { Diagnostic, DiagnosticLocation, DocumentFile, RuleDefinition } from '../types.js';

interface RequirementOccurrence {
  file: string;
  location: DiagnosticLocation;
}

export const requirementsTestsRule: RuleDefinition = {
  id: 'traceability/requirements-tests',
  description: 'Check that requirement IDs are referenced by test documents.',
  defaultSeverity: 'warning',
  run(context) {
    const config = context.config.traceability || {};
    const requirementPattern = expression(config.requirementPattern || '\\b(?:BR|FR|SR)-[A-Z0-9]+(?:-[0-9]+)?\\b', 'requirementPattern');
    const testPattern = expression(config.testCasePattern || '\\bTC-[A-Z0-9]+(?:-[0-9]+)?\\b', 'testCasePattern');
    const requirementFiles = context.documents.filter(document => matchesAny(document.path, config.requirementFiles || ['**/*REQUIREMENTS*.md']));
    const testFiles = context.documents.filter(document => matchesAny(document.path, config.testFiles || ['**/*TEST*.md']));
    const requirements = locate(requirementFiles, requirementPattern);
    const testCases = collect(testFiles.map(file => file.body), testPattern);
    const testText = testFiles.map(file => file.body).join('\n');
    const covered = [...requirements.keys()].filter(id => testText.includes(id));
    const diagnostics: Diagnostic[] = [];
    for (const [id, occurrence] of requirements) {
      if (testText.includes(id)) continue;
      // Anchor the diagnostic at the requirement definition so editors can open
      // the document instead of reporting a location-less, root-wide issue.
      diagnostics.push({
        ruleId: '', severity: 'warning',
        message: `Requirement has no test reference: ${id}`,
        file: occurrence.file,
        location: occurrence.location,
        data: { requirementId: id },
      });
    }
    if (requirements.size > 0 && testCases.size === 0) diagnostics.push({ ruleId: '', severity: 'warning', message: 'Requirements exist but no test case IDs were found.' });
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

function expression(source: string, name: string): RegExp {
  try { return new RegExp(source, 'g'); }
  catch (error) { throw new Error(`Invalid ${name}: ${error instanceof Error ? error.message : String(error)}`); }
}

function collect(values: string[], regex: RegExp): Set<string> {
  const result = new Set<string>();
  for (const value of values) for (const match of value.matchAll(new RegExp(regex.source, regex.flags))) result.add(match[0]);
  return result;
}

/** Records the first definition of every requirement ID, in document order. */
function locate(documents: DocumentFile[], regex: RegExp): Map<string, RequirementOccurrence> {
  const result = new Map<string, RequirementOccurrence>();
  for (const document of documents) {
    // Rules scan the body, but editors address lines of the whole file, so
    // positions must include any front matter that precedes the body.
    const source = document.content.endsWith(document.body) ? document.content : document.body;
    const bodyOffset = source.length - document.body.length;
    for (const match of document.body.matchAll(new RegExp(regex.source, regex.flags))) {
      if (result.has(match[0])) continue;
      result.set(match[0], { file: document.path, location: positionAt(source, bodyOffset + match.index) });
    }
  }
  return result;
}

function positionAt(source: string, index: number): DiagnosticLocation {
  const before = source.slice(0, index);
  const lineStart = before.lastIndexOf('\n') + 1;
  return { line: before.split(/\r?\n/).length, column: index - lineStart + 1 };
}

function matchesAny(file: string, patterns: string[]): boolean {
  return patterns.some(pattern => new Minimatch(pattern, { nocase: true, dot: true }).match(file));
}
