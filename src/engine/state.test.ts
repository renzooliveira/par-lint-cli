import { describe, it, expect } from 'vitest';
import { reconcileFindings } from './state.js';
import { createFinding } from './finding.js';

describe('reconcileFindings', () => {
  const baseFinding = createFinding({
    rule_id: 'state/test',
    file: 'test.ts',
    line: 1,
    severity: 'warning',
    message: 'test',
    source_principle: 'test',
    category: 'state',
  });

  it('marks all as new when no previous state', () => {
    const result = reconcileFindings([baseFinding], null);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]!.status).toBe('new');
    expect(result.resolved).toHaveLength(0);
  });

  it('marks persistent when finding exists in previous state', () => {
    const previousState = {
      schema_version: '1.0',
      last_execution: { timestamp: '2026-01-01', par_lint_version: '0.1.0' },
      active_findings: {
        [baseFinding.finding_id]: {
          finding_id: baseFinding.finding_id,
          rule_id: baseFinding.rule_id,
          file: baseFinding.file,
          line: baseFinding.line,
          first_seen: '2026-01-01',
          last_seen: '2026-01-01',
        },
      },
    };

    const result = reconcileFindings([baseFinding], previousState);
    expect(result.findings[0]!.status).toBe('persistent');
    expect(result.findings[0]!.first_seen).toBe('2026-01-01');
    expect(result.resolved).toHaveLength(0);
  });

  it('returns resolved findings from previous state not in current', () => {
    const previousState = {
      schema_version: '1.0',
      last_execution: { timestamp: '2026-01-01', par_lint_version: '0.1.0' },
      active_findings: {
        'old-finding-id': {
          finding_id: 'old-finding-id',
          rule_id: 'state/old',
          file: 'old.ts',
          line: 5,
          first_seen: '2026-01-01',
          last_seen: '2026-01-01',
        },
      },
    };

    const result = reconcileFindings([baseFinding], previousState);
    expect(result.findings[0]!.status).toBe('new');
    expect(result.resolved).toHaveLength(1);
    expect(result.resolved[0]!.finding_id).toBe('old-finding-id');
  });
});
