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

  it('merges options-only profile overrides with inherited severity', () => {
    const value = pack();
    value.profiles.base.rules = { 'example/rule': 'error' };
    value.profiles.child.rules = { 'example/rule': { options: { child: true } } };

    expect(validateStandardPackManifest(value)).toEqual([]);
    expect(resolveStandardProfile(value, 'child').rules?.['example/rule']).toEqual({
      severity: 'error',
      options: { child: true },
    });
  });

  it('does not retain parent options when a child profile declares severity', () => {
    const value = pack();
    value.profiles.base.rules = { 'example/rule': { severity: 'error', options: { parent: true } } };
    value.profiles.child.rules = { 'example/rule': { severity: 'warning' } };

    expect(resolveStandardProfile(value, 'child').rules?.['example/rule']).toEqual({ severity: 'warning' });
  });

  it('rejects empty and malformed Standard Pack rule settings', () => {
    const value = pack();
    value.rules = { 'example/empty': {}, 'example/options': { options: [] } };
    expect(validateStandardPackManifest(value).join('\n')).toMatch(/severity and\/or options only|options must be an object/);
  });

  it('rejects non-namespaced Standard Pack rule IDs', () => {
    const value = pack();
    value.rules = { headings: 'warning' };
    expect(validateStandardPackManifest(value).join('\n')).toMatch(/non-namespaced rule/);
  });
});
