/**
 * Configuration loading for docs-lint CLI
 */
import fs from 'fs';
import path from 'path';
import { defaultConfig } from '../types.js';
/**
 * Load configuration from file or defaults
 */
export async function loadConfig(configPath, docsDir) {
    let config = {};
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
            }
            else {
                config = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
            }
            break;
        }
    }
    // Override docsDir if specified
    if (docsDir) {
        config.docsDir = docsDir;
    }
    return {
        ...defaultConfig,
        ...config,
        rules: {
            ...defaultConfig.rules,
            ...config.rules,
        },
    };
}
//# sourceMappingURL=config.js.map