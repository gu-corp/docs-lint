import { existsSync } from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'rolldown';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.join(packageRoot, 'dist/node/editor-session.js');
const output = path.join(packageRoot, 'dist/editor-runtime.mjs');
if (!existsSync(input)) throw new Error(`Compile docs-lint before building the editor runtime: ${input}`);

const nodeBuiltins = new Set(builtinModules.flatMap(name => [name, `node:${name}`]));

await build({
  input,
  platform: 'node',
  external: id => id.startsWith('node:') || nodeBuiltins.has(id),
  output: {
    file: output,
    format: 'esm',
  },
});

if (!existsSync(output)) throw new Error(`Editor runtime was not generated: ${output}`);
