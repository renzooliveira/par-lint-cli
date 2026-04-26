import { describe, it, expect } from 'vitest';
import { formatMarkdown } from './markdown.js';
import type { Report } from '../../types/report.js';
import { createFinding } from '../../engine/finding.js';

function makeReport(findings: Report['findings']): Report {
  return {
    report_id: 'test-id',
    schema_version: '1.0',
    par_lint_version: '0.1.0',
    timestamp: '2026-04-26T00:00:00Z',
    project: { name: 'test-project', root: '/tmp', git_sha: '', git_branch: '' },
    summary: { total_findings: findings.length, by_severity: {}, by_category: {}, by_confidence_band: {}, by_status: {} },
    findings,
    diff: { new_findings: [], resolved_findings: [], persistent_findings: [], stale_findings: [] },
    performance: { total_duration_ms: 100, by_tool: {}, cache_hit_rate: 0, files_analyzed: 5 },
  };
}

describe('formatMarkdown', () => {
  it('produces markdown with header and table', () => {
    const finding = createFinding({
      rule_id: 'a11y/missing-alt',
      file: 'src/app.html',
      line: 5,
      severity: 'error',
      message: 'img missing alt',
      source_principle: 'WCAG 1.1.1',
      category: 'a11y',
    });

    const output = formatMarkdown(makeReport([finding]));

    expect(output).toContain('# par-lint Report');
    expect(output).toContain('test-project');
    expect(output).toContain('| Severity');
    expect(output).toContain('a11y/missing-alt');
    expect(output).toContain('img missing alt');
  });

  it('shows no-findings message when empty', () => {
    const output = formatMarkdown(makeReport([]));

    expect(output).toContain('No findings');
  });
});
