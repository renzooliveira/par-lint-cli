import { describe, it, expect } from 'vitest';
import { formatClaudeContext } from './claude-context.js';
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
    performance: { total_duration_ms: 100, by_tool: {}, cache_hit_rate: 0, files_analyzed: 5 },
  };
}

describe('formatClaudeContext', () => {
  it('produces correct top-level scan summary', () => {
    const finding = createFinding({
      rule_id: 'rxjs/nested-subscribe',
      file: 'src/auth.service.ts',
      line: 47,
      severity: 'error',
      message: 'subscribe() inside another subscribe()',
      source_principle: 'Nested subscribes leak memory',
      category: 'rxjs',
    });

    const report = makeReport([finding]);
    const output = JSON.parse(formatClaudeContext(report));

    expect(output.scan).toEqual({
      files: 5,
      issues: 1,
      rules_v: '0.1.0',
      by_category: { rxjs: 1 },
      by_severity: { error: 1 },
    });
  });

  it('maps findings to compact issues with sequential IDs', () => {
    const f1 = createFinding({
      rule_id: 'rxjs/nested-subscribe',
      file: 'src/auth.service.ts',
      line: 47,
      severity: 'error',
      message: 'subscribe() inside another subscribe()',
      source_principle: 'Nested subscribes leak memory',
      category: 'rxjs',
      fix_complexity: 'M',
      suggested_fix: {
        kind: 'replace',
        description: 'Replace inner subscribe with switchMap',
        diff: 'outer$.pipe(switchMap(x => inner$(x)))',
      },
    });

    const f2 = createFinding({
      rule_id: 'hygiene/console-log-in-production',
      file: 'src/app.ts',
      line: 10,
      severity: 'warning',
      message: 'console.log() in production code',
      source_principle: 'Console logging pollutes output',
      category: 'hygiene',
    });

    const report = makeReport([f1, f2]);
    const output = JSON.parse(formatClaudeContext(report));

    expect(output.issues).toHaveLength(2);

    expect(output.issues[0]).toEqual({
      id: 'F1',
      rule: 'rxjs/nested-subscribe',
      loc: 'src/auth.service.ts:47',
      severity: 'error',
      evidence: 'subscribe() inside another subscribe()',
      principle: 'Nested subscribes leak memory',
      fix: {
        complexity: 'M',
        approach: 'Replace inner subscribe with switchMap',
        example: 'outer$.pipe(switchMap(x => inner$(x)))',
      },
      confidence: 1.0,
    });

    expect(output.issues[1]).toEqual({
      id: 'F2',
      rule: 'hygiene/console-log-in-production',
      loc: 'src/app.ts:10',
      severity: 'warning',
      evidence: 'console.log() in production code',
      principle: 'Console logging pollutes output',
      fix: {
        complexity: 'S',
        approach: '',
        example: '',
      },
      confidence: 1.0,
    });
  });

  it('handles empty findings', () => {
    const report = makeReport([]);
    const output = JSON.parse(formatClaudeContext(report));

    expect(output.scan.issues).toBe(0);
    expect(output.issues).toEqual([]);
  });

  it('outputs valid JSON string', () => {
    const finding = createFinding({
      rule_id: 'test/rule',
      file: 'src/x.ts',
      line: 1,
      severity: 'info',
      message: 'test',
      source_principle: 'test principle',
      category: 'test',
    });

    const raw = formatClaudeContext(makeReport([finding]));
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('includes category summary in scan', () => {
    const findings = [
      createFinding({ rule_id: 'rxjs/a', file: 'a.ts', line: 1, severity: 'error', message: 'a', source_principle: 'p', category: 'rxjs' }),
      createFinding({ rule_id: 'rxjs/b', file: 'b.ts', line: 2, severity: 'warning', message: 'b', source_principle: 'p', category: 'rxjs' }),
      createFinding({ rule_id: 'arch/c', file: 'c.ts', line: 3, severity: 'error', message: 'c', source_principle: 'p', category: 'arch' }),
    ];

    const report = makeReport(findings);
    const output = JSON.parse(formatClaudeContext(report));

    expect(output.scan.by_category).toEqual({ rxjs: 2, arch: 1 });
    expect(output.scan.by_severity).toEqual({ error: 2, warning: 1 });
  });

  it('respects maxIssues option', () => {
    const findings = Array.from({ length: 10 }, (_, i) =>
      createFinding({ rule_id: `test/r${i}`, file: `f${i}.ts`, line: i + 1, severity: 'warning', message: `msg${i}`, source_principle: 'p', category: 'test' }),
    );

    const report = makeReport(findings);
    const output = JSON.parse(formatClaudeContext(report, { maxIssues: 3 }));

    expect(output.issues).toHaveLength(3);
    expect(output.scan.issues).toBe(10);
    expect(output.scan.truncated).toBe(true);
  });

  it('does not set truncated when all issues fit', () => {
    const finding = createFinding({ rule_id: 'test/r', file: 'a.ts', line: 1, severity: 'error', message: 'm', source_principle: 'p', category: 'test' });
    const report = makeReport([finding]);
    const output = JSON.parse(formatClaudeContext(report, { maxIssues: 50 }));

    expect(output.issues).toHaveLength(1);
    expect(output.scan.truncated).toBeUndefined();
  });

  it('sorts issues by severity: error first, then warning, then info', () => {
    const findings = [
      createFinding({ rule_id: 'test/w', file: 'w.ts', line: 1, severity: 'warning', message: 'warn', source_principle: 'p', category: 'test' }),
      createFinding({ rule_id: 'test/i', file: 'i.ts', line: 2, severity: 'info', message: 'info', source_principle: 'p', category: 'test' }),
      createFinding({ rule_id: 'test/e', file: 'e.ts', line: 3, severity: 'error', message: 'err', source_principle: 'p', category: 'test' }),
      createFinding({ rule_id: 'test/e2', file: 'e2.ts', line: 4, severity: 'error', message: 'err2', source_principle: 'p', category: 'test' }),
    ];

    const report = makeReport(findings);
    const output = JSON.parse(formatClaudeContext(report));

    expect(output.issues.map((i: { severity: string }) => i.severity)).toEqual([
      'error', 'error', 'warning', 'info',
    ]);
  });
});
