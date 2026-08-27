import fs from 'fs';
import path from 'path';
import { DocsLintEngine } from '../core/engine.js';
import { loadConfiguredStandard } from './standard-pack.js';
import { loadDocuments, securePath } from './workspace.js';
export async function lintWorkspace(config, options = {}) {
    const documents = await loadDocuments(config);
    const standard = loadConfiguredStandard(config);
    const engine = new DocsLintEngine();
    return engine.lint({
        config,
        documents,
        ...standard,
        only: options.only,
        skip: options.skip,
        pathExists(relativePath) {
            try {
                return fs.existsSync(securePath(config.rootPath, relativePath, false));
            }
            catch {
                return false;
            }
        },
    });
}
export function relativeDisplayPath(config, absolutePath) {
    return path.relative(config.rootPath, absolutePath).split(path.sep).join('/');
}
//# sourceMappingURL=run.js.map