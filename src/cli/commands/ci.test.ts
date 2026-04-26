import { describe, it, expect } from 'vitest';
import { buildCiSummary } from './ci.js';

describe('buildCiSummary', () => {
  it('shows pass when no errors', () => {
    const output = buildCiSummary({ total: 5, errors: 0, warnings: 3, infos: 2, baselineFiltered: 0 });
    expect(output).toContain('PASS');
  });

  it('shows fail when errors exist', () => {
    const output = buildCiSummary({ total: 3, errors: 2, warnings: 1, infos: 0, baselineFiltered: 0 });
    expect(output).toContain('FAIL');
    expect(output).toContain('2 error');
  });

  it('shows baseline filtered count', () => {
    const output = buildCiSummary({ total: 1, errors: 0, warnings: 1, infos: 0, baselineFiltered: 10 });
    expect(output).toContain('10');
    expect(output).toContain('baseline');
  });

  it('handles zero findings', () => {
    const output = buildCiSummary({ total: 0, errors: 0, warnings: 0, infos: 0, baselineFiltered: 0 });
    expect(output).toContain('PASS');
    expect(output).toContain('0 findings');
  });
});
