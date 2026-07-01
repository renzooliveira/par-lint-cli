import { describe, it, expect } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { formatClaudeContext } from './claude-context.js';
import type { Report } from '../../types/report.js';
import type { Finding, FindingStatus } from '../../types/finding.js';
import { createFinding } from '../../engine/finding.js';

function withStatus(finding: Finding, status: FindingStatus): Finding {
  return { ...finding, status };
}

function makeReport(findings: Report['findings'], root = '/tmp'): Report {
  return {
    report_id: 'test-id',
    schema_version: '1.0',
    par_lint_version: '0.1.0',
    timestamp: '2026-04-26T00:00:00Z',
    project: { name: 'test', root, git_sha: '', git_branch: '' },
    summary: { total_findings: findings.length, by_severity: {}, by_category: {}, by_confidence_band: {}, by_status: {} },
    findings,
    diff: { new_findings: [], resolved_findings: [], persistent_findings: [], stale_findings: [] },
    performance: { total_duration_ms: 100, by_tool: {}, cache_hit_rate: 0, files_analyzed: 5 },
  };
}

describe('formatClaudeContext', () => {
  it('produces correct top-level scan summary', async () => {
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
    const output = JSON.parse(await formatClaudeContext(report));

    expect(output.scan).toEqual({
      files: 5,
      issues: 1,
      rules_v: '0.1.0',
      by_category: { rxjs: 1 },
      by_severity: { error: 1 },
    });
  });

  it('maps findings to compact issues with sequential IDs', async () => {
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
    const output = JSON.parse(await formatClaudeContext(report));

    expect(output.issues).toHaveLength(2);

    expect(output.issues[0]).toMatchObject({
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

    expect(output.issues[1]).toMatchObject({
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

  it('handles empty findings', async () => {
    const report = makeReport([]);
    const output = JSON.parse(await formatClaudeContext(report));

    expect(output.scan.issues).toBe(0);
    expect(output.issues).toEqual([]);
  });

  it('outputs valid JSON string', async () => {
    const finding = createFinding({
      rule_id: 'test/rule',
      file: 'src/x.ts',
      line: 1,
      severity: 'info',
      message: 'test',
      source_principle: 'test principle',
      category: 'test',
    });

    const raw = await formatClaudeContext(makeReport([finding]));
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('includes category summary in scan', async () => {
    const findings = [
      createFinding({ rule_id: 'rxjs/a', file: 'a.ts', line: 1, severity: 'error', message: 'a', source_principle: 'p', category: 'rxjs' }),
      createFinding({ rule_id: 'rxjs/b', file: 'b.ts', line: 2, severity: 'warning', message: 'b', source_principle: 'p', category: 'rxjs' }),
      createFinding({ rule_id: 'arch/c', file: 'c.ts', line: 3, severity: 'error', message: 'c', source_principle: 'p', category: 'arch' }),
    ];

    const report = makeReport(findings);
    const output = JSON.parse(await formatClaudeContext(report));

    expect(output.scan.by_category).toEqual({ rxjs: 2, arch: 1 });
    expect(output.scan.by_severity).toEqual({ error: 2, warning: 1 });
  });

  it('respects maxIssues option with coherent counts', async () => {
    const findings = Array.from({ length: 10 }, (_, i) =>
      createFinding({ rule_id: `test/r${i}`, file: `f${i}.ts`, line: i + 1, severity: 'warning', message: `msg${i}`, source_principle: 'p', category: 'test' }),
    );

    const report = makeReport(findings);
    const output = JSON.parse(await formatClaudeContext(report, { maxIssues: 3 }));

    expect(output.issues).toHaveLength(3);
    expect(output.scan.issues).toBe(3);
    expect(output.scan.by_category).toEqual({ test: 3 });
    expect(output.scan.by_severity).toEqual({ warning: 3 });
    expect(output.scan.truncated).toEqual({
      total_issues: 10,
      total_by_category: { test: 10 },
      total_by_severity: { warning: 10 },
    });
  });

  it('does not set truncated when all issues fit', async () => {
    const finding = createFinding({ rule_id: 'test/r', file: 'a.ts', line: 1, severity: 'error', message: 'm', source_principle: 'p', category: 'test' });
    const report = makeReport([finding]);
    const output = JSON.parse(await formatClaudeContext(report, { maxIssues: 50 }));

    expect(output.issues).toHaveLength(1);
    expect(output.scan.issues).toBe(1);
    expect(output.scan.truncated).toBeUndefined();
  });

  it('treats maxIssues 0 as no limit', async () => {
    const findings = Array.from({ length: 5 }, (_, i) =>
      createFinding({ rule_id: `test/r${i}`, file: `f${i}.ts`, line: i + 1, severity: 'error', message: `msg${i}`, source_principle: 'p', category: 'test' }),
    );

    const report = makeReport(findings);
    const output = JSON.parse(await formatClaudeContext(report, { maxIssues: 0 }));

    expect(output.issues).toHaveLength(5);
    expect(output.scan.truncated).toBeUndefined();
  });

  it('truncated scan counts match delivered issues, not total', async () => {
    const findings = [
      createFinding({ rule_id: 'ux/a', file: 'a.ts', line: 1, severity: 'error', message: 'a', source_principle: 'p', category: 'ux' }),
      createFinding({ rule_id: 'ux/b', file: 'b.ts', line: 2, severity: 'error', message: 'b', source_principle: 'p', category: 'ux' }),
      createFinding({ rule_id: 'imports/c', file: 'c.ts', line: 3, severity: 'error', message: 'c', source_principle: 'p', category: 'imports' }),
      createFinding({ rule_id: 'imports/d', file: 'd.ts', line: 4, severity: 'warning', message: 'd', source_principle: 'p', category: 'imports' }),
      createFinding({ rule_id: 'perf/e', file: 'e.ts', line: 5, severity: 'warning', message: 'e', source_principle: 'p', category: 'perf' }),
    ];

    const report = makeReport(findings);
    const output = JSON.parse(await formatClaudeContext(report, { maxIssues: 3 }));

    expect(output.issues).toHaveLength(3);
    expect(output.scan.issues).toBe(3);
    expect(output.scan.by_category).toEqual({ ux: 2, imports: 1 });
    expect(output.scan.by_severity).toEqual({ error: 3 });
    expect(output.scan.truncated).toEqual({
      total_issues: 5,
      total_by_category: { ux: 2, imports: 2, perf: 1 },
      total_by_severity: { error: 3, warning: 2 },
    });
  });

  it('sorts issues by severity: error first, then warning, then info', async () => {
    const findings = [
      createFinding({ rule_id: 'test/w', file: 'w.ts', line: 1, severity: 'warning', message: 'warn', source_principle: 'p', category: 'test' }),
      createFinding({ rule_id: 'test/i', file: 'i.ts', line: 2, severity: 'info', message: 'info', source_principle: 'p', category: 'test' }),
      createFinding({ rule_id: 'test/e', file: 'e.ts', line: 3, severity: 'error', message: 'err', source_principle: 'p', category: 'test' }),
      createFinding({ rule_id: 'test/e2', file: 'e2.ts', line: 4, severity: 'error', message: 'err2', source_principle: 'p', category: 'test' }),
    ];

    const report = makeReport(findings);
    const output = JSON.parse(await formatClaudeContext(report));

    expect(output.issues.map((i: { severity: string }) => i.severity)).toEqual([
      'error', 'error', 'warning', 'info',
    ]);
  });

  it('sorts issues by fix_complexity within the same severity: S, M, L, XL', async () => {
    const findings = [
      createFinding({ rule_id: 'test/xl', file: 'xl.ts', line: 1, severity: 'warning', message: 'xl', source_principle: 'p', category: 'test', fix_complexity: 'XL' }),
      createFinding({ rule_id: 'test/s', file: 's.ts', line: 2, severity: 'warning', message: 's', source_principle: 'p', category: 'test', fix_complexity: 'S' }),
      createFinding({ rule_id: 'test/l', file: 'l.ts', line: 3, severity: 'warning', message: 'l', source_principle: 'p', category: 'test', fix_complexity: 'L' }),
      createFinding({ rule_id: 'test/m', file: 'm.ts', line: 4, severity: 'warning', message: 'm', source_principle: 'p', category: 'test', fix_complexity: 'M' }),
    ];

    const report = makeReport(findings);
    const output = JSON.parse(await formatClaudeContext(report));

    expect(output.issues.map((i: { fix: { complexity: string } }) => i.fix.complexity)).toEqual([
      'S', 'M', 'L', 'XL',
    ]);
  });

  it('keeps severity as the dominant sort key over fix_complexity', async () => {
    const findings = [
      createFinding({ rule_id: 'test/error-xl', file: 'a.ts', line: 1, severity: 'error', message: 'error xl', source_principle: 'p', category: 'test', fix_complexity: 'XL' }),
      createFinding({ rule_id: 'test/warning-s', file: 'b.ts', line: 2, severity: 'warning', message: 'warning s', source_principle: 'p', category: 'test', fix_complexity: 'S' }),
    ];

    const report = makeReport(findings);
    const output = JSON.parse(await formatClaudeContext(report));

    expect(output.issues.map((i: { severity: string }) => i.severity)).toEqual([
      'error', 'warning',
    ]);
  });

  it('survives maxIssues truncation when fix_complexity is cheaper within the same severity', async () => {
    const findings = [
      createFinding({ rule_id: 'test/xl', file: 'xl.ts', line: 1, severity: 'warning', message: 'xl', source_principle: 'p', category: 'test', fix_complexity: 'XL' }),
      createFinding({ rule_id: 'test/l', file: 'l.ts', line: 2, severity: 'warning', message: 'l', source_principle: 'p', category: 'test', fix_complexity: 'L' }),
      createFinding({ rule_id: 'test/s', file: 's.ts', line: 3, severity: 'warning', message: 's', source_principle: 'p', category: 'test', fix_complexity: 'S' }),
    ];

    const report = makeReport(findings);
    const output = JSON.parse(await formatClaudeContext(report, { maxIssues: 1 }));

    expect(output.issues).toHaveLength(1);
    expect(output.issues[0].rule).toBe('test/s');
    expect(output.issues[0].fix.complexity).toBe('S');
  });

  describe('snippet extraction', () => {
    let tmpDir: string;

    it('includes snippet with context lines from real file', async () => {
      tmpDir = path.join(os.tmpdir(), `par-lint-snippet-${Date.now()}`);
      await mkdir(tmpDir, { recursive: true });
      const lines = [
        'import { foo } from "bar";',
        '',
        'function hello() {',
        '  const x = 1;',
        '  console.log(x);',
        '  return x;',
        '}',
      ];
      await writeFile(path.join(tmpDir, 'test.ts'), lines.join('\n'));

      const finding = createFinding({
        rule_id: 'test/rule',
        file: 'test.ts',
        line: 5,
        severity: 'warning',
        message: 'console.log found',
        source_principle: 'p',
        category: 'test',
      });

      const report = makeReport([finding], tmpDir);
      const output = JSON.parse(await formatClaudeContext(report));

      expect(output.issues[0].snippet).toBe(
        '3| function hello() {\n4|   const x = 1;\n5>   console.log(x);\n6|   return x;\n7| }',
      );

      await rm(tmpDir, { recursive: true });
    });

    it('returns empty snippet when file does not exist', async () => {
      const finding = createFinding({
        rule_id: 'test/rule',
        file: 'nonexistent.ts',
        line: 5,
        severity: 'warning',
        message: 'test',
        source_principle: 'p',
        category: 'test',
      });

      const report = makeReport([finding], '/tmp/does-not-exist-dir');
      const output = JSON.parse(await formatClaudeContext(report));

      expect(output.issues[0].snippet).toBe('');
    });

    it('handles finding on first line', async () => {
      tmpDir = path.join(os.tmpdir(), `par-lint-snippet-first-${Date.now()}`);
      await mkdir(tmpDir, { recursive: true });
      await writeFile(path.join(tmpDir, 'first.ts'), 'line1\nline2\nline3\nline4');

      const finding = createFinding({
        rule_id: 'test/rule',
        file: 'first.ts',
        line: 1,
        severity: 'warning',
        message: 'test',
        source_principle: 'p',
        category: 'test',
      });

      const report = makeReport([finding], tmpDir);
      const output = JSON.parse(await formatClaudeContext(report));

      expect(output.issues[0].snippet).toBe('1> line1\n2| line2\n3| line3');

      await rm(tmpDir, { recursive: true });
    });
  });

  describe('deduplication', () => {
    it('groups findings with same file+rule into grouped issue', async () => {
      const findings = [
        createFinding({ rule_id: 'hygiene/dead-code', file: 'a.ts', line: 10, severity: 'warning', message: 'dead code', source_principle: 'p', category: 'hygiene' }),
        createFinding({ rule_id: 'hygiene/dead-code', file: 'a.ts', line: 20, severity: 'warning', message: 'dead code', source_principle: 'p', category: 'hygiene' }),
        createFinding({ rule_id: 'hygiene/dead-code', file: 'a.ts', line: 30, severity: 'warning', message: 'dead code', source_principle: 'p', category: 'hygiene' }),
      ];

      const report = makeReport(findings);
      const output = JSON.parse(await formatClaudeContext(report));

      expect(output.issues).toHaveLength(1);
      const grouped = output.issues[0];
      expect(grouped.id).toBe('G1');
      expect(grouped.rule).toBe('hygiene/dead-code');
      expect(grouped.file).toBe('a.ts');
      expect(grouped.occurrences).toHaveLength(3);
      expect(grouped.occurrences[0].line).toBe(10);
      expect(grouped.occurrences[1].line).toBe(20);
      expect(grouped.occurrences[2].line).toBe(30);
      expect(grouped.occurrences[0].evidence).toBe('dead code');
      expect(grouped.loc).toBeUndefined();
    });

    it('does not group findings with same rule but different files', async () => {
      const findings = [
        createFinding({ rule_id: 'naming/bad', file: 'a.ts', line: 1, severity: 'warning', message: 'bad name x', source_principle: 'p', category: 'naming' }),
        createFinding({ rule_id: 'naming/bad', file: 'b.ts', line: 1, severity: 'warning', message: 'bad name y', source_principle: 'p', category: 'naming' }),
      ];

      const report = makeReport(findings);
      const output = JSON.parse(await formatClaudeContext(report));

      expect(output.issues).toHaveLength(2);
      expect(output.issues[0].id).toBe('F1');
      expect(output.issues[1].id).toBe('F2');
      expect(output.issues[0].loc).toBe('a.ts:1');
      expect(output.issues[1].loc).toBe('b.ts:1');
    });

    it('mixes grouped and ungrouped issues', async () => {
      const findings = [
        createFinding({ rule_id: 'hygiene/dead-code', file: 'a.ts', line: 10, severity: 'error', message: 'dead', source_principle: 'p', category: 'hygiene' }),
        createFinding({ rule_id: 'hygiene/dead-code', file: 'a.ts', line: 20, severity: 'error', message: 'dead', source_principle: 'p', category: 'hygiene' }),
        createFinding({ rule_id: 'naming/bad', file: 'b.ts', line: 5, severity: 'warning', message: 'bad', source_principle: 'p', category: 'naming' }),
      ];

      const report = makeReport(findings);
      const output = JSON.parse(await formatClaudeContext(report));

      expect(output.issues).toHaveLength(2);
      const grouped = output.issues.find((i: { occurrences?: unknown[] }) => i.occurrences);
      const single = output.issues.find((i: { loc?: string }) => i.loc);
      expect(grouped.id).toMatch(/^G/);
      expect(grouped.occurrences).toHaveLength(2);
      expect(single.id).toMatch(/^F/);
      expect(single.loc).toBe('b.ts:5');
    });
  });

  describe('status', () => {
    it('carries status from finding onto a single issue', async () => {
      const finding = withStatus(
        createFinding({
          rule_id: 'hygiene/dead-code',
          file: 'a.ts',
          line: 10,
          severity: 'warning',
          message: 'dead code',
          source_principle: 'p',
          category: 'hygiene',
        }),
        'persistent',
      );

      const report = makeReport([finding]);
      const output = JSON.parse(await formatClaudeContext(report));

      expect(output.issues[0].id).toBe('F1');
      expect(output.issues[0].status).toBe('persistent');
    });

    it('carries per-occurrence status when grouping findings with different statuses', async () => {
      const findings = [
        withStatus(
          createFinding({ rule_id: 'hygiene/dead-code', file: 'a.ts', line: 10, severity: 'warning', message: 'dead code', source_principle: 'p', category: 'hygiene' }),
          'new',
        ),
        withStatus(
          createFinding({ rule_id: 'hygiene/dead-code', file: 'a.ts', line: 20, severity: 'warning', message: 'dead code', source_principle: 'p', category: 'hygiene' }),
          'persistent',
        ),
      ];

      const report = makeReport(findings);
      const output = JSON.parse(await formatClaudeContext(report));

      expect(output.issues).toHaveLength(1);
      const grouped = output.issues[0];
      expect(grouped.id).toBe('G1');
      expect(grouped.occurrences[0].line).toBe(10);
      expect(grouped.occurrences[0].status).toBe('new');
      expect(grouped.occurrences[1].line).toBe(20);
      expect(grouped.occurrences[1].status).toBe('persistent');
      expect(grouped.status).toBeUndefined();
    });
  });
});
