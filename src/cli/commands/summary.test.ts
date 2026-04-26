import { describe, it, expect } from 'vitest';
import { buildSummaryOutput } from './summary.js';
import type { Finding } from '../../types/finding.js';

function fakeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    finding_id: 'f1',
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
    first_seen: '2026-01-01',
    last_seen: '2026-04-26',
    ...overrides,
  };
}

describe('buildSummaryOutput', () => {
  it('shows total findings count', () => {
    const findings = [
      fakeFinding({ finding_id: 'f1', severity: 'error', category: 'arch' }),
      fakeFinding({ finding_id: 'f2', severity: 'warning', category: 'perf' }),
      fakeFinding({ finding_id: 'f3', severity: 'info', category: 'perf' }),
    ];
    const output = buildSummaryOutput(findings);
    expect(output).toContain('3 findings');
  });

  it('shows severity breakdown', () => {
    const findings = [
      fakeFinding({ severity: 'error' }),
      fakeFinding({ severity: 'error', finding_id: 'f2' }),
      fakeFinding({ severity: 'warning', finding_id: 'f3' }),
    ];
    const output = buildSummaryOutput(findings);
    expect(output).toContain('error');
    expect(output).toContain('warning');
  });

  it('shows category breakdown', () => {
    const findings = [
      fakeFinding({ category: 'arch' }),
      fakeFinding({ category: 'perf', finding_id: 'f2' }),
    ];
    const output = buildSummaryOutput(findings);
    expect(output).toContain('arch');
    expect(output).toContain('perf');
  });

  it('shows top files', () => {
    const findings = [
      fakeFinding({ file: 'src/big.ts' }),
      fakeFinding({ file: 'src/big.ts', finding_id: 'f2' }),
      fakeFinding({ file: 'src/small.ts', finding_id: 'f3' }),
    ];
    const output = buildSummaryOutput(findings);
    expect(output).toContain('src/big.ts');
  });

  it('handles empty findings', () => {
    const output = buildSummaryOutput([]);
    expect(output).toContain('0 findings');
  });
});
