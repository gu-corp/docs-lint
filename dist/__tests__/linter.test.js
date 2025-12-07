import { describe, it, expect } from 'vitest';
import { createLinter, defaultConfig } from '../index.js';
import path from 'path';
import fs from 'fs';
import os from 'os';
describe('createLinter', () => {
    it('should create a linter instance', () => {
        const linter = createLinter({ docsDir: './docs' });
        expect(linter).toBeDefined();
        expect(typeof linter.lint).toBe('function');
    });
    it('should use default config when not provided', () => {
        const linter = createLinter({});
        expect(linter).toBeDefined();
    });
});
describe('Linter.lint', () => {
    it('should throw error for empty docs directory', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-lint-test-'));
        const docsDir = path.join(tmpDir, 'docs');
        fs.mkdirSync(docsDir);
        try {
            const linter = createLinter({ docsDir });
            await expect(linter.lint()).rejects.toThrow('No markdown files found');
        }
        finally {
            fs.rmSync(tmpDir, { recursive: true });
        }
    });
    it('should detect broken links', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-lint-test-'));
        const docsDir = path.join(tmpDir, 'docs');
        fs.mkdirSync(docsDir);
        fs.writeFileSync(path.join(docsDir, 'test.md'), '# Test\n\n[Broken Link](./nonexistent.md)\n');
        try {
            const linter = createLinter({
                docsDir,
                rules: { ...defaultConfig.rules, brokenLinks: 'error' },
            });
            const result = await linter.lint();
            expect(result.filesChecked).toBe(1);
            const brokenLinksRule = result.ruleResults.find(r => r.rule === 'brokenLinks');
            expect(brokenLinksRule?.issues.length).toBeGreaterThan(0);
        }
        finally {
            fs.rmSync(tmpDir, { recursive: true });
        }
    });
    it('should skip rules when configured as off', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-lint-test-'));
        const docsDir = path.join(tmpDir, 'docs');
        fs.mkdirSync(docsDir);
        fs.writeFileSync(path.join(docsDir, 'test.md'), '# Test\n\n[Broken Link](./nonexistent.md)\n');
        try {
            const linter = createLinter({
                docsDir,
                rules: { ...defaultConfig.rules, brokenLinks: 'off' },
            });
            const result = await linter.lint();
            const brokenLinksRule = result.ruleResults.find(r => r.rule === 'brokenLinks');
            expect(brokenLinksRule).toBeUndefined();
        }
        finally {
            fs.rmSync(tmpDir, { recursive: true });
        }
    });
});
describe('defaultConfig', () => {
    it('should have required properties', () => {
        expect(defaultConfig).toBeDefined();
        expect(defaultConfig.docsDir).toBe('./docs');
        expect(defaultConfig.rules).toBeDefined();
        expect(defaultConfig.include).toBeDefined();
        expect(defaultConfig.exclude).toBeDefined();
    });
});
//# sourceMappingURL=linter.test.js.map