import { describe, it, expect } from 'vitest';
import { getProgressBar } from '../cli/formatters.js';
describe('getProgressBar', () => {
    it('should return empty bar for 0%', () => {
        const bar = getProgressBar(0);
        expect(bar).toContain('░'.repeat(20));
    });
    it('should return full bar for 100%', () => {
        const bar = getProgressBar(100);
        expect(bar).toContain('█'.repeat(20));
    });
    it('should return half bar for 50%', () => {
        const bar = getProgressBar(50);
        expect(bar).toContain('█'.repeat(10));
        expect(bar).toContain('░'.repeat(10));
    });
    it('should handle edge cases', () => {
        expect(() => getProgressBar(0)).not.toThrow();
        expect(() => getProgressBar(100)).not.toThrow();
        expect(() => getProgressBar(75)).not.toThrow();
    });
});
//# sourceMappingURL=formatters.test.js.map