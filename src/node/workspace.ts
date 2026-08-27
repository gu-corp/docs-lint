import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import type { DocumentFile, ResolvedDocsLintConfig } from '../core/types.js';

export async function loadDocuments(config: ResolvedDocsLintConfig): Promise<DocumentFile[]> {
  if (!fs.existsSync(config.rootPath) || !fs.statSync(config.rootPath).isDirectory()) {
    throw new Error(`Documentation root was not found: ${config.rootPath}`);
  }
  const matches = new Set<string>();
  for (const pattern of config.include) {
    for (const file of await glob(pattern, {
      cwd: config.rootPath,
      ignore: config.exclude,
      nodir: true,
      follow: false,
    })) matches.add(toPosix(file));
  }
  const documents: DocumentFile[] = [];
  for (const relativePath of [...matches].sort()) {
    const absolutePath = securePath(config.rootPath, relativePath);
    const content = fs.readFileSync(absolutePath, 'utf8');
    const parsed = parseFrontMatter(content);
    documents.push({ path: relativePath, absolutePath, content, ...parsed });
  }
  return documents;
}

export function writeDocument(rootPath: string, relativePath: string, content: string, force = false): string {
  const target = securePath(rootPath, relativePath, false);
  if (fs.existsSync(target) && !force) throw new Error(`Document already exists: ${relativePath}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  assertRealPathWithinRoot(rootPath, nearestExistingPath(target), relativePath);
  fs.writeFileSync(target, content, { encoding: 'utf8', flag: force ? 'w' : 'wx' });
  return target;
}

export function parseFrontMatter(content: string): { frontMatter: Record<string, string>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { frontMatter: {}, body: content };
  const frontMatter: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*?)\s*$/);
    if (item) frontMatter[item[1]] = item[2].replace(/^['"]|['"]$/g, '');
  }
  return { frontMatter, body: content.slice(match[0].length) };
}

export function securePath(rootPath: string, relativePath: string, requireExisting = true): string {
  const root = path.resolve(rootPath);
  const target = path.resolve(root, relativePath);
  const relative = path.relative(root, target);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Path escapes documentation root: ${relativePath}`);
  }
  if (requireExisting) {
    if (!fs.existsSync(target)) throw new Error(`Path does not exist: ${relativePath}`);
    assertRealPathWithinRoot(root, target, relativePath);
  } else {
    assertRealPathWithinRoot(root, nearestExistingPath(target), relativePath);
  }
  return target;
}

export function toPosix(value: string): string { return value.split(path.sep).join('/'); }

function nearestExistingPath(target: string): string {
  let current = target;
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) return current;
    current = parent;
  }
  return current;
}

function assertRealPathWithinRoot(rootPath: string, candidatePath: string, label: string): void {
  const root = fs.realpathSync(rootPath);
  const candidate = fs.realpathSync(candidatePath);
  const relative = path.relative(root, candidate);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Path symlink escapes documentation root: ${label}`);
  }
}
