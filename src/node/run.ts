import fs from 'fs';
import path from 'path';
import { DocsLintEngine } from '../core/engine.js';
import type { LintReport, ResolvedDocsLintConfig } from '../core/types.js';
import { loadConfiguredStandard } from './standard-pack.js';
import { loadDocuments, securePath } from './workspace.js';

export interface RunOptions {
  only?: string[];
  skip?: string[];
}

export async function lintWorkspace(config: ResolvedDocsLintConfig, options: RunOptions = {}): Promise<LintReport> {
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
      try { return fs.existsSync(securePath(config.rootPath, relativePath, false)); } catch { return false; }
    },
  });
}

export function relativeDisplayPath(config: ResolvedDocsLintConfig, absolutePath: string): string {
  return path.relative(config.rootPath, absolutePath).split(path.sep).join('/');
}
