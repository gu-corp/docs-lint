import type { Diagnostic, RuleDefinition } from '../types.js';
import { markdownHeadings } from './markdown.js';

export const standardStructureRule: RuleDefinition = {
  id: 'structure/standard-pack',
  description: 'Validate folders and required documents declared by the selected Standard Pack profile.',
  defaultSeverity: 'error',
  run(context) {
    if (!context.standardPack || !context.standardProfile) return [];
    const diagnostics: Diagnostic[] = [];
    for (const folder of context.standardPack.manifest.structure || []) {
      if (folder.required && !context.pathExists(folder.path)) diagnostics.push({ ruleId: '', severity: 'error', file: folder.path, message: 'Required documentation folder is missing.' });
    }
    for (const typeId of context.standardProfile.requiredDocuments || []) {
      const type = context.standardPack.manifest.documentTypes[typeId];
      if (type?.suggestedPath && !context.documentPaths.has(type.suggestedPath)) {
        diagnostics.push({ ruleId: '', severity: 'error', file: type.suggestedPath, message: `Required document is missing for type ${typeId}.`, data: { documentType: typeId } });
      }
    }
    return diagnostics;
  },
};

export const requiredSectionsRule: RuleDefinition = {
  id: 'document/required-sections',
  description: 'Validate required headings for documents identified by Standard Pack type.',
  defaultSeverity: 'warning',
  run(context) {
    if (!context.standardPack) return [];
    const diagnostics: Diagnostic[] = [];
    for (const document of context.documents) {
      const typeId = document.frontMatter.documentType || Object.entries(context.standardPack.manifest.documentTypes)
        .find(([, type]) => type.suggestedPath === document.path)?.[0];
      if (!typeId) continue;
      const type = context.standardPack.manifest.documentTypes[typeId];
      if (!type) {
        diagnostics.push({ ruleId: '', severity: 'warning', file: document.path, message: `Unknown documentType in front matter: ${typeId}` });
        continue;
      }
      const headings = markdownHeadings(document.body);
      for (const section of type.sections || []) {
        const titles = typeof section.title === 'string' ? [section.title] : Object.values(section.title);
        if (section.required && !headings.some(heading => titles.includes(heading.title) && (!section.level || heading.level === section.level))) {
          diagnostics.push({ ruleId: '', severity: 'warning', file: document.path, message: `Required section is missing: ${titles[0]}`, data: { documentType: typeId, sectionId: section.id } });
        }
      }
    }
    return diagnostics;
  },
};
