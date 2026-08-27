import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'rolldown';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.join(packageRoot, 'dist/node/editor-session.js');
const output = path.join(packageRoot, 'dist/editor-runtime.mjs');
if (!existsSync(input)) throw new Error(`Compile docs-lint before building the editor runtime: ${input}`);

const nodeBuiltins = new Set(builtinModules.flatMap(name => [name, `node:${name}`]));
const loadedPackageRoots = new Set();
const includedPackageRoots = new Set();

await build({
  input,
  platform: 'node',
  external: id => id.startsWith('node:') || nodeBuiltins.has(id),
  plugins: [{
    name: 'third-party-license-collector',
    load(id) {
      const root = packageRootForModule(id);
      if (root) loadedPackageRoots.add(root);
      return null;
    },
    generateBundle(_options, bundle) {
      for (const item of Object.values(bundle)) {
        if (item.type !== 'chunk') continue;
        for (const id of Object.keys(item.modules)) {
          const root = packageRootForModule(id);
          if (root) includedPackageRoots.add(root);
        }
      }
    },
  }],
  output: {
    file: output,
    format: 'esm',
  },
});

if (!existsSync(output)) throw new Error(`Editor runtime was not generated: ${output}`);

// generateBundle reports the modules that survived tree shaking. Keep load-hook
// collection as a compatibility fallback for Rolldown versions that omit the
// module table, while preferring the exact set included in the emitted chunk.
const bundledPackageRoots = includedPackageRoots.size ? includedPackageRoots : loadedPackageRoots;
writeThirdPartyLicenses([...bundledPackageRoots]);

function packageRootForModule(id) {
  const normalized = id.replaceAll('\\', '/').replace(/^\0+/, '').split('?', 1)[0];
  const marker = '/node_modules/';
  const markerIndex = normalized.lastIndexOf(marker);
  if (markerIndex < 0) return undefined;
  const parts = normalized.slice(markerIndex + marker.length).split('/');
  const packageParts = parts[0]?.startsWith('@') ? parts.slice(0, 2) : parts.slice(0, 1);
  if (!packageParts.length || packageParts.some(part => !part)) return undefined;
  const root = normalized.slice(0, markerIndex + marker.length) + packageParts.join('/');
  return existsSync(root) ? realpathSync(root) : undefined;
}

function writeThirdPartyLicenses(packageRoots) {
  const licensesDirectory = path.join(packageRoot, 'dist/third-party-licenses');
  const noticesPath = path.join(packageRoot, 'dist/THIRD-PARTY-NOTICES.md');
  rmSync(licensesDirectory, { recursive: true, force: true });
  mkdirSync(licensesDirectory, { recursive: true });

  const packages = packageRoots.map(readPackageLicense).sort((left, right) =>
    left.name.localeCompare(right.name) || left.version.localeCompare(right.version));
  const usedFilenames = new Set();
  const noticeSections = [];
  for (const item of packages) {
    const filename = `${licenseFilenamePart(item.name)}-${licenseFilenamePart(item.version)}.txt`;
    if (usedFilenames.has(filename)) throw new Error(`Third-party license filename collision: ${filename}`);
    usedFilenames.add(filename);
    writeFileSync(path.join(licensesDirectory, filename), ensureTrailingNewline(item.text));
    noticeSections.push([
      `### ${item.name}@${item.version}`,
      '',
      `- License: ${item.license}`,
      `- License text: [${filename}](third-party-licenses/${filename})`,
    ].join('\n'));
  }

  const notices = [
    '# Third-Party Notices',
    '',
    'This file lists third-party packages bundled into `dist/editor-runtime.mjs`.',
    'It is generated from the modules emitted by Rolldown; do not edit it manually.',
    '',
    'The full license text for each package is included in `dist/third-party-licenses/`.',
    '',
    '## Packages',
    '',
    packages.length ? noticeSections.join('\n\n') : 'No third-party packages are bundled.',
    '',
  ].join('\n');
  writeFileSync(noticesPath, notices);
}

function readPackageLicense(root) {
  const metadataPath = path.join(root, 'package.json');
  if (!existsSync(metadataPath)) throw new Error(`Bundled package metadata was not found: ${metadataPath}`);
  const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
  if (typeof metadata.name !== 'string' || typeof metadata.version !== 'string') {
    throw new Error(`Bundled package metadata is missing name or version: ${metadataPath}`);
  }
  const license = typeof metadata.license === 'string'
    ? metadata.license
    : typeof metadata.license?.type === 'string' ? metadata.license.type : undefined;
  if (!license) throw new Error(`Bundled package does not declare a license: ${metadata.name}@${metadata.version}`);

  const licenseName = readdirSync(root).sort().find(name => /^(?:licen[cs]e|copying)(?:[._-]|$)/i.test(name)
    && statSync(path.join(root, name)).isFile());
  if (!licenseName) throw new Error(`Bundled package has no license text: ${metadata.name}@${metadata.version}`);
  const rootReal = realpathSync(root);
  const licenseReal = realpathSync(path.join(root, licenseName));
  const relative = path.relative(rootReal, licenseReal);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Bundled package license symlink escapes its package: ${metadata.name}@${metadata.version}`);
  }
  return { name: metadata.name, version: metadata.version, license, text: readFileSync(licenseReal, 'utf8') };
}

function licenseFilenamePart(value) {
  return value.replace(/^@/, 'at-').replaceAll('/', '--').replace(/[^A-Za-z0-9._-]/g, '-');
}

function ensureTrailingNewline(value) {
  return value.endsWith('\n') ? value : `${value}\n`;
}
