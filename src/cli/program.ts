import { Command } from 'commander';
import { registerCreateCommand } from './commands/create.js';
import { registerInitCommand } from './commands/init.js';
import { registerLintCommand } from './commands/lint.js';
import { registerPackCommand } from './commands/pack.js';

export function createProgram(version: string): Command {
  const program = new Command()
    .name('docs-lint')
    .description('Standard Pack based documentation validation and creation')
    .version(version)
    .showHelpAfterError();
  registerLintCommand(program);
  registerInitCommand(program);
  registerPackCommand(program);
  registerCreateCommand(program);
  return program;
}
