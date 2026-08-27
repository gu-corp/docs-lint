import type { Diagnostic, RuleDefinition } from '../types.js';

export const terminologyRule: RuleDefinition = {
  id: 'content/terminology',
  description: 'Detect configured non-preferred terminology.',
  defaultSeverity: 'warning',
  run(context) {
    const terminology = [
      ...(context.standardPack?.manifest.terminology || []),
      ...(context.config.terminology || []),
    ];
    const diagnostics: Diagnostic[] = [];
    for (const document of context.documents) {
      for (const term of terminology) {
        for (const variant of term.variants) {
          let offset = 0;
          while ((offset = document.body.indexOf(variant, offset)) >= 0) {
            diagnostics.push({
              ruleId: '', severity: 'warning', file: document.path,
              location: { line: document.body.slice(0, offset).split(/\r?\n/).length },
              message: `Use preferred term “${term.preferred}” instead of “${variant}”.`,
              fix: { description: `Replace with ${term.preferred}`, replacement: term.preferred },
            });
            offset += variant.length || 1;
          }
        }
      }
    }
    return diagnostics;
  },
};
