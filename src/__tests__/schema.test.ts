import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('published JSON Schemas', () => {
  it('requires namespaced rule IDs in Standard Pack and profile rule maps', () => {
    const schema = JSON.parse(fs.readFileSync(
      new URL('../../schemas/standard-pack.schema.json', import.meta.url),
      'utf8',
    )) as {
      properties: { rules: { propertyNames: { pattern: string } } };
      $defs: { profile: { properties: { rules: { propertyNames: { pattern: string } } } } };
    };
    const patterns = [
      schema.properties.rules.propertyNames.pattern,
      schema.$defs.profile.properties.rules.propertyNames.pattern,
    ];

    for (const source of patterns) {
      const pattern = new RegExp(source);
      expect(pattern.test('markdown/headings')).toBe(true);
      expect(pattern.test('headings')).toBe(false);
    }
  });
});
