/**
 * Configuration loading for docs-lint CLI
 */
import fs from 'fs';
import path from 'path';
import { defaultConfig, type DocsLintConfig } from '../types.js';

/**
 * Load configuration from file or defaults
 */
export async function loadConfig(configPath?: string, docsDir?: string): Promise<DocsLintConfig> {
  let config: Partial<DocsLintConfig> = {};

  // Try to load from specified path or default locations
  const paths = configPath
    ? [configPath]
    : ['docs-lint.config.json', 'docs-lint.config.js', '.docs-lintrc.json'];

  for (const p of paths) {
    const fullPath = path.resolve(process.cwd(), p);
    if (fs.existsSync(fullPath)) {
      if (p.endsWith('.js')) {
        const module = await import(`file://${fullPath}`);
        config = module.default || module;
      } else {
        config = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      }
      break;
    }
  }

  // Build final config - config file takes precedence over defaults
  // docsDir CLI option overrides config file only if explicitly provided (not default)
  const finalConfig = {
    ...defaultConfig,
    ...config,
    rules: {
      ...defaultConfig.rules,
      ...config.rules,
    },
  };

  // Only override docsDir if explicitly provided and different from default
  // This allows config file's docsDir to take precedence over CLI default
  if (docsDir && docsDir !== './docs') {
    finalConfig.docsDir = docsDir;
  }

  return finalConfig;
}
