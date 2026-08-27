import { describe, expect, it } from 'vitest';
import { resolveStandardProfile, validateStandardPackManifest } from '../standards/manifest.js';
import type { DocumentStandardPack } from '../standards/types.js';

function pack(): DocumentStandardPack {
  return {
    schemaVersion: 1,
    id: 'example/team',
    version: '1.0.0',
    title: 'Example',
    defaultProfile: 'child',
    profiles: {
      base: { title: 'Base', documentTypes: ['requirements'], requiredDocuments: ['requirements'], variables: { owner: 'base' } },
      child: { title: 'Child', extends: ['base'], variables: { locale: 'ja' } },
    },
    documentTypes: { requirements: { title: 'Requirements', template: 'templates/requirements.md' } },
  };
}

describe('Standard Pack manifest', () => {
  it('resolves profile inheritance deterministically', () => {
    const profile = resolveStandardProfile(pack(), 'child');
    expect(profile.documentTypes).toEqual(['requirements']);
    expect(profile.variables).toEqual({ owner: 'base', locale: 'ja' });
    expect(profile.inheritance).toEqual(['base', 'child']);
  });

  it('reports missing references and inheritance cycles', () => {
    const value = pack();
    value.profiles.base.extends = ['child'];
    value.profiles.child.documentTypes = ['missing'];
    const issues = validateStandardPackManifest(value);
    expect(issues.join('\n')).toMatch(/cycle/i);
    expect(issues.join('\n')).toMatch(/missing document type/);
  });
});
