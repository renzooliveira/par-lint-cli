import { describe, it, expect } from 'vitest';
import { generateRuleCatalog } from './docs.js';

describe('generateRuleCatalog', () => {
  const fakeRules = [
    { id: 'b-rule', category: 'perf', severity: 'warning', version: '1.0', applicable_to: ['ts'], description: 'Perf issue B' },
    { id: 'a-rule', category: 'perf', severity: 'error', version: '1.0', applicable_to: ['html'], description: 'Perf issue A' },
    { id: 'c-rule', category: 'a11y', severity: 'info', version: '1.0', applicable_to: [] },
  ] as any[];

  it('contains markdown header', () => {
    const md = generateRuleCatalog(fakeRules);
    expect(md).toContain('# par-lint Rule Catalog');
  });

  it('contains total count', () => {
    const md = generateRuleCatalog(fakeRules);
    expect(md).toContain('3 rules');
  });

  it('groups by category sorted alphabetically', () => {
    const md = generateRuleCatalog(fakeRules);
    const a11yIdx = md.indexOf('## a11y');
    const perfIdx = md.indexOf('## perf');
    expect(a11yIdx).toBeLessThan(perfIdx);
  });

  it('sorts rules by id within category', () => {
    const md = generateRuleCatalog(fakeRules);
    const aIdx = md.indexOf('a-rule');
    const bIdx = md.indexOf('b-rule');
    expect(aIdx).toBeLessThan(bIdx);
  });

  it('contains table headers with description', () => {
    const md = generateRuleCatalog(fakeRules);
    expect(md).toContain('| Rule ID');
    expect(md).toContain('| Description');
  });

  it('contains rule data in table rows', () => {
    const md = generateRuleCatalog(fakeRules);
    expect(md).toContain('| a-rule');
    expect(md).toContain('| error');
    expect(md).toContain('| html');
  });

  it('includes description when available', () => {
    const md = generateRuleCatalog(fakeRules);
    expect(md).toContain('Perf issue A');
    expect(md).toContain('Perf issue B');
  });
});
