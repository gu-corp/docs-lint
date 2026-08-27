import path from 'path';
import type { Diagnostic, DocumentFile, RuleDefinition } from '../types.js';

export const internalLinksRule: RuleDefinition = {
  id: 'links/internal',
  description: 'Detect Markdown links whose document target does not exist.',
  defaultSeverity: 'error',
  run(context) {
    const diagnostics: Diagnostic[] = [];
    for (const document of context.documents) {
      for (const match of document.body.matchAll(/(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/g)) {
        const href = match[1].replace(/^<|>$/g, '');
        if (!href || href.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
        const rawPath = href.split('#')[0].split('?')[0];
        if (!rawPath) continue;
        let decoded: string;
        try { decoded = decodeURIComponent(rawPath); } catch { decoded = rawPath; }
        const extension = path.posix.extname(decoded).toLowerCase();
        if (extension && !['.md', '.mdx', '.markdown', '.mdown', '.mkd'].includes(extension)) continue;
        const target = normalizeTarget(document.path, decoded);
        if (!target || target.startsWith('../')) {
          diagnostics.push(issue(document, match.index, `Link escapes the documentation root: ${href}`));
          continue;
        }
        const candidates = extension
          ? [target]
          : [target, `${target}.md`, `${target}.mdx`, `${target}/README.md`, `${target}/index.md`, `${target}/index.mdx`];
        if (!candidates.some(candidate => context.documentPaths.has(candidate))) {
          diagnostics.push(issue(document, match.index, `Linked document does not exist: ${href}`));
        }
      }
    }
    return diagnostics;
  },
};

export const headingsRule: RuleDefinition = {
  id: 'markdown/headings',
  description: 'Require one H1 and prevent skipped heading levels.',
  defaultSeverity: 'warning',
  run(context) {
    const diagnostics: Diagnostic[] = [];
    for (const document of context.documents) {
      const headings = markdownHeadings(document.body);
      const h1 = headings.filter(item => item.level === 1);
      if (h1.length === 0) diagnostics.push({ ruleId: '', severity: 'warning', file: document.path, message: 'Document has no H1 heading.' });
      if (h1.length > 1) diagnostics.push({ ruleId: '', severity: 'warning', file: document.path, location: { line: h1[1].line }, message: 'Document has more than one H1 heading.' });
      for (let index = 1; index < headings.length; index += 1) {
        if (headings[index].level > headings[index - 1].level + 1) {
          diagnostics.push({ ruleId: '', severity: 'warning', file: document.path, location: { line: headings[index].line }, message: `Heading level skips from H${headings[index - 1].level} to H${headings[index].level}.` });
        }
      }
    }
    return diagnostics;
  },
};

export const codeFenceLanguageRule: RuleDefinition = {
  id: 'markdown/code-fence-language',
  description: 'Require a language identifier on fenced code blocks.',
  defaultSeverity: 'warning',
  run(context) {
    const diagnostics: Diagnostic[] = [];
    for (const document of context.documents) {
      const lines = document.body.split(/\r?\n/);
      let fence: '`' | '~' | undefined;
      for (let index = 0; index < lines.length; index += 1) {
        const opening = lines[index].match(/^\s*(`{3,}|~{3,})(.*)$/);
        if (!opening) continue;
        const marker = opening[1][0] as '`' | '~';
        if (!fence) {
          fence = marker;
          if (!opening[2].trim()) diagnostics.push({ ruleId: '', severity: 'warning', file: document.path, location: { line: index + 1 }, message: 'Code fence has no language identifier.' });
        } else if (fence === marker) fence = undefined;
      }
    }
    return diagnostics;
  },
};

export function markdownHeadings(markdown: string): Array<{ level: number; title: string; line: number }> {
  const headings: Array<{ level: number; title: string; line: number }> = [];
  let fence: string | undefined;
  for (const [index, line] of markdown.split(/\r?\n/).entries()) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) { fence = fence ? undefined : fenceMatch[1][0]; continue; }
    if (fence) continue;
    const match = line.match(/^(#{1,6})[ \t]+(.+?)\s*#*\s*$/);
    if (match) headings.push({ level: match[1].length, title: match[2].replace(/[`*_]/g, '').trim(), line: index + 1 });
  }
  return headings;
}

function normalizeTarget(current: string, target: string): string {
  const joined = target.startsWith('/') ? target.slice(1) : path.posix.join(path.posix.dirname(current), target);
  return path.posix.normalize(joined).replace(/^\.\//, '');
}

function issue(document: DocumentFile, index: number | undefined, message: string): Diagnostic {
  const line = index === undefined ? undefined : document.body.slice(0, index).split(/\r?\n/).length;
  return { ruleId: '', severity: 'error', file: document.path, location: line ? { line } : undefined, message };
}
