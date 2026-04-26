import { describe, it, expect } from 'vitest';
import { formatSarif } from './sarif.js';
import type { Report } from '../../types/report.js';
import { createFinding } from '../../engine/finding.js';

function makeReport(findings: Report['findings']): Report {
  return {
    report_id: 'test-id',
    schema_version: '1.0',
    par_lint_version: '0.1.0',
    timestamp: '2026-04-26T00:00:00Z',
    project: { name: 'test', root: '/tmp', git_sha: '', git_branch: '' },
    summary: { total_findings: findings.length, by_severity: {}, by_category: {}, by_confidence_band: {}, by_status: {} },
    findings,
    diff: { new_findings: [], resolved_findings: [], persistent_findings: [], stale_findings: [] },
    performance: { total_duration_ms: 100, by_tool: {}, cache_hit_rate: 0, files_analyzed: 1 },
  };
}

describe('formatSarif', () => {
  it('produces valid SARIF 2.1.0 structure', () => {
    const finding = createFinding({
      rule_id: 'state/test-rule',
      file: 'src/app.ts',
      line: 10,
      column: 5,
      severity: 'error',
      message: 'Test finding',
      source_principle: 'Test principle',
      category: 'state',
    });

    const report = makeReport([finding]);
    const output = formatSarif(report);
    const sarif = JSON.parse(output);

    expect(sarif.version).toBe('2.1.0');
    expect(sarif.runs).toHaveLength(1);
    expect(sarif.runs[0].tool.driver.name).toBe('par-lint');
    expect(sarif.runs[0].results).toHaveLength(1);
    expect(sarif.runs[0].results[0].ruleId).toBe('state/test-rule');
    expect(sarif.runs[0].results[0].level).toBe('error');
    expect(sarif.runs[0].results[0].locations[0].physicalLocation.region.startLine).toBe(10);
  });

  it('handles empty findings', () => {
    const report = makeReport([]);
    const output = formatSarif(report);
    const sarif = JSON.parse(output);

    expect(sarif.runs[0].results).toHaveLength(0);
    expect(sarif.runs[0].tool.driver.rules).toHaveLength(0);
  });
});
