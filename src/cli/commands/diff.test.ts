import { describe, it, expect } from 'vitest';
import { computeDiff } from './diff.js';
import type { Finding } from '../../types/finding.js';

function fakeFinding(id: string, overrides: Partial<Finding> = {}): Finding {
  return {
    finding_id: id,
    rule_id: 'test/rule',
    rule_version: '1.0',
    file: 'src/app.ts',
    line: 1,
    severity: 'warning',
    confidence: 0.9,
    confidence_band: 'confident_positive',
    fix_complexity: 'S',
    message: 'test',
    evidence_trail: [],
    source_principle: 'test',
    source_realization: '',
    category: 'test',
    status: 'new',
    first_seen: '',
    last_seen: '',
    ...overrides,
  };
}

describe('computeDiff', () => {
  it('identifies new findings', () => {
    const before = [fakeFinding('f1')];
    const after = [fakeFinding('f1'), fakeFinding('f2')];

    const diff = computeDiff(before, after);
    expect(diff.added).toHaveLength(1);
    expect(diff.added[0]!.finding_id).toBe('f2');
    expect(diff.removed).toHaveLength(0);
  });

  it('identifies resolved findings', () => {
    const before = [fakeFinding('f1'), fakeFinding('f2')];
    const after = [fakeFinding('f1')];

    const diff = computeDiff(before, after);
    expect(diff.removed).toHaveLength(1);
    expect(diff.removed[0]!.finding_id).toBe('f2');
    expect(diff.added).toHaveLength(0);
  });

  it('identifies unchanged findings', () => {
    const before = [fakeFinding('f1'), fakeFinding('f2')];
    const after = [fakeFinding('f1'), fakeFinding('f2')];

    const diff = computeDiff(before, after);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.unchanged).toBe(2);
  });

  it('computes delta counts', () => {
    const before = [
      fakeFinding('f1', { severity: 'error' }),
      fakeFinding('f2', { severity: 'warning' }),
    ];
    const after = [
      fakeFinding('f1', { severity: 'error' }),
      fakeFinding('f3', { severity: 'info' }),
    ];

    const diff = computeDiff(before, after);
    expect(diff.delta).toBe(0);
    expect(diff.added).toHaveLength(1);
    expect(diff.removed).toHaveLength(1);
  });
});
