// Main exports
export { DocsLinter, createLinter } from './linter.js';
export { defaultConfig } from './types.js';
// Rule exports
export { checkBrokenLinks, checkLegacyFileNames, checkVersionInfo, checkRelatedDocuments, checkHeadingHierarchy, checkTodoComments, checkCodeBlockLanguage, checkOrphanDocuments, checkTerminology, checkBidirectionalRefs, checkRequiredFiles, } from './rules/index.js';
// Structure rule exports
export { checkFolderStructure, checkFolderNumbering, checkFileNaming, checkDuplicateContent, } from './rules/structure.js';
// AI prompt exports
export { generateAIPrompt, generateJSONSummary } from './ai-prompt.js';
//# sourceMappingURL=index.js.map