/**
 * CLI utility functions for docs-lint
 */
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import chalk from 'chalk';

/**
 * Interactive prompt helper
 */
export function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const displayQuestion = defaultValue
    ? `${question} [${defaultValue}]: `
    : `${question}: `;

  return new Promise((resolve) => {
    rl.question(displayQuestion, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

/**
 * Select from options
 */
export function selectOption(question: string, options: string[], defaultIndex = 0): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(`\n${question}`);
  options.forEach((opt, i) => {
    const marker = i === defaultIndex ? chalk.green('→') : ' ';
    console.log(`  ${marker} ${i + 1}) ${opt}`);
  });

  return new Promise((resolve) => {
    rl.question(`Select [${defaultIndex + 1}]: `, (answer) => {
      rl.close();
      const idx = answer.trim() ? parseInt(answer, 10) - 1 : defaultIndex;
      resolve(options[idx] || options[defaultIndex]);
    });
  });
}

/**
 * Get the templates directory path
 */
export function getTemplatesDir(dirname: string): string {
  // Templates are in ../templates relative to dist/cli.js
  const templatesPath = path.join(dirname, '..', 'templates');

  if (fs.existsSync(templatesPath)) {
    return templatesPath;
  }

  throw new Error(`Templates directory not found at: ${templatesPath}`);
}
