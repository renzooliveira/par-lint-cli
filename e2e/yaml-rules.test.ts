import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import path from 'node:path';

const CLI = path.resolve(import.meta.dirname, '../dist/index.js');
const FIXTURE = path.resolve(import.meta.dirname, 'fixtures/yaml-rules-project');

function run(args: string): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(`node "${CLI}" ${args}`, {
      encoding: 'utf-8',
      timeout: 15000,
      env: { ...process.env, NO_COLOR: '1' },
    });
    return { stdout, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; status?: number };
    return { stdout: e.stdout ?? '', exitCode: e.status ?? 1 };
  }
}

interface Finding {
  rule_id: string;
  severity: string;
  file: string;
  line: number;
  message: string;
  suggested_fix?: { kind: string; description: string };
}

interface Report {
  report_id: string;
  findings: Finding[];
  summary: { total_findings: number };
}

interface ClaudeContextIssue {
  id: string;
  rule: string;
  loc: string;
  severity: string;
  snippet: string;
  evidence: string;
  principle: string;
  fix: { complexity: string; approach: string; example: string };
  confidence: number;
}

interface ClaudeContextOutput {
  scan: {
    files: number;
    issues: number;
    rules_v: string;
    by_category: Record<string, number>;
    by_severity: Record<string, number>;
  };
  issues: ClaudeContextIssue[];
}

describe('YAML Rules E2E', () => {
  describe('regex mode rules fire via CLI', () => {
    it('detects console.log via hygiene/console-log-in-production', { timeout: 20000 }, () => {
      const { stdout } = run(`review --target "${FIXTURE}" --json --no-cache --rule hygiene/console-log-in-production`);
      const report: Report = JSON.parse(stdout);

      expect(report.findings.length).toBeGreaterThanOrEqual(2);
      expect(report.findings.every(f => f.rule_id === 'hygiene/console-log-in-production')).toBe(true);

      const serviceFinding = report.findings.find(f => f.file.includes('app.service.ts'));
      expect(serviceFinding).toBeDefined();
      expect(serviceFinding!.line).toBe(6);
    });

    it('detects deprecated structural directives via template/deprecated-structural-directive', { timeout: 20000 }, () => {
      const { stdout } = run(`review --target "${FIXTURE}" --json --no-cache --rule template/deprecated-structural-directive`);
      const report: Report = JSON.parse(stdout);

      expect(report.findings.length).toBeGreaterThanOrEqual(1);
      const dashFinding = report.findings.find(f => f.file.includes('dashboard.component.html'));
      expect(dashFinding).toBeDefined();
      expect(dashFinding!.message).toBeTruthy();
    });

    it('detects button-missing-type via template/button-missing-type', { timeout: 20000 }, () => {
      const { stdout } = run(`review --target "${FIXTURE}" --json --no-cache --rule template/button-missing-type`);
      const report: Report = JSON.parse(stdout);

      expect(report.findings.length).toBe(1);
      expect(report.findings[0]!.file).toContain('dashboard.component.html');
      expect(report.findings[0]!.line).toBe(3);
    });

    it('detects deprecated @import via scss/deprecated-import', { timeout: 20000 }, () => {
      const { stdout } = run(`review --target "${FIXTURE}" --json --no-cache --rule scss/deprecated-import`);
      const report: Report = JSON.parse(stdout);

      expect(report.findings.length).toBe(1);
      expect(report.findings[0]!.file).toContain('dashboard.component.scss');
      expect(report.findings[0]!.line).toBe(1);
    });
  });

  describe('file-presence mode rules fire via CLI', () => {
    it('detects missing OnPush via component/missing-onpush', { timeout: 20000 }, () => {
      const { stdout } = run(`review --target "${FIXTURE}" --json --no-cache --rule component/missing-onpush`);
      const report: Report = JSON.parse(stdout);

      expect(report.findings.length).toBeGreaterThanOrEqual(1);
      const dashFinding = report.findings.find(f => f.file.includes('dashboard.component.ts'));
      expect(dashFinding).toBeDefined();
      expect(dashFinding!.line).toBe(1);
      expect(dashFinding!.message).toContain('OnPush');
    });

    it('does not flag service files for component rules', { timeout: 20000 }, () => {
      const { stdout } = run(`review --target "${FIXTURE}" --json --no-cache --rule component/missing-onpush`);
      const report: Report = JSON.parse(stdout);

      const serviceFinding = report.findings.find(f => f.file.includes('app.service.ts'));
      expect(serviceFinding).toBeUndefined();
    });
  });

  describe('claude-context format', () => {
    it('produces valid schema with scan + issues', { timeout: 20000 }, () => {
      const { stdout } = run(`review --target "${FIXTURE}" --output claude-context --no-cache --max-issues 0`);
      const output: ClaudeContextOutput = JSON.parse(stdout);

      expect(output).toHaveProperty('scan');
      expect(output).toHaveProperty('issues');
      expect(output.scan.files).toBeGreaterThan(0);
      expect(output.scan.issues).toBeGreaterThan(0);
      expect(output.scan.rules_v).toBe('0.2.0');
      expect(output.scan.by_category).toBeDefined();
      expect(output.scan.by_severity).toBeDefined();
    });

    it('issues have all required fields', { timeout: 20000 }, () => {
      const { stdout } = run(`review --target "${FIXTURE}" --output claude-context --no-cache --max-issues 0`);
      const output: ClaudeContextOutput = JSON.parse(stdout);

      for (const issue of output.issues) {
        expect(issue.id).toMatch(/^[A-Z]\d+$/);
        expect(issue.rule).toBeTruthy();
        expect(issue.severity).toMatch(/^(error|warning|info)$/);
        expect(issue.principle).toBeTruthy();
        expect(issue.fix).toHaveProperty('complexity');
        expect(typeof issue.confidence).toBe('number');
        expect(issue.confidence).toBeGreaterThanOrEqual(0);
        expect(issue.confidence).toBeLessThanOrEqual(1);

        const isGrouped = 'occurrences' in issue;
        if (isGrouped) {
          expect((issue as any).file).toBeTruthy();
          expect((issue as any).occurrences.length).toBeGreaterThan(0);
        } else {
          expect(issue.loc).toMatch(/\w+:\d+/);
          expect(issue.snippet).toBeTruthy();
          expect(issue.evidence).toBeTruthy();
        }
      }
    });

    it('issues are sorted by severity (errors first)', { timeout: 20000 }, () => {
      const { stdout } = run(`review --target "${FIXTURE}" --output claude-context --no-cache --max-issues 0`);
      const output: ClaudeContextOutput = JSON.parse(stdout);

      const severityOrder = { error: 0, warning: 1, info: 2 };
      for (let i = 1; i < output.issues.length; i++) {
        const prev = severityOrder[output.issues[i - 1]!.severity as keyof typeof severityOrder];
        const curr = severityOrder[output.issues[i]!.severity as keyof typeof severityOrder];
        expect(prev).toBeLessThanOrEqual(curr);
      }
    });

    it('--max-issues truncates output', { timeout: 20000 }, () => {
      const allStdout = run(`review --target "${FIXTURE}" --output claude-context --no-cache --max-issues 0`);
      const allOutput: ClaudeContextOutput = JSON.parse(allStdout.stdout);
      const totalIssues = allOutput.scan.issues;

      const { stdout } = run(`review --target "${FIXTURE}" --output claude-context --no-cache --max-issues 3`);
      const output: ClaudeContextOutput = JSON.parse(stdout);

      expect(output.issues.length).toBeLessThanOrEqual(3);
      expect(totalIssues).toBeGreaterThan(3);
    });

    it('--max-tokens truncates output more aggressively than --max-issues alone', { timeout: 20000 }, () => {
      const allStdout = run(`review --target "${FIXTURE}" --output claude-context --no-cache --max-issues 0`);
      const allOutput: ClaudeContextOutput = JSON.parse(allStdout.stdout);
      const totalIssues = allOutput.scan.issues;

      const { stdout } = run(`review --target "${FIXTURE}" --output claude-context --no-cache --max-issues 0 --max-tokens 50`);
      const output: ClaudeContextOutput = JSON.parse(stdout);

      expect(output).toHaveProperty('scan');
      expect(output).toHaveProperty('issues');
      expect(output.scan.files).toBeGreaterThan(0);
      expect(output.issues.length).toBeLessThan(totalIssues);
    });

    it('snippets contain context lines around finding', { timeout: 20000 }, () => {
      const { stdout } = run(`review --target "${FIXTURE}" --output claude-context --no-cache --max-issues 0`);
      const output: ClaudeContextOutput = JSON.parse(stdout);

      const issueWithSnippet = output.issues.find(i => i.snippet.includes('>'));
      expect(issueWithSnippet).toBeDefined();
      expect(issueWithSnippet!.snippet).toContain('|');
    });

    it('by_severity counts match issue list', { timeout: 20000 }, () => {
      const { stdout } = run(`review --target "${FIXTURE}" --output claude-context --no-cache --max-issues 0`);
      const output: ClaudeContextOutput = JSON.parse(stdout);

      const countFromIssues = output.issues.reduce((acc, i) => {
        acc[i.severity] = (acc[i.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      for (const [sev, count] of Object.entries(output.scan.by_severity)) {
        if (countFromIssues[sev]) {
          expect(count).toBeGreaterThanOrEqual(countFromIssues[sev]!);
        }
      }
    });
  });

  describe('suggested_fix propagation', () => {
    it('YAML rule with suggested_fix includes it in JSON output', { timeout: 20000 }, () => {
      const { stdout } = run(`review --target "${FIXTURE}" --json --no-cache --rule typescript/ts-ignore-without-reason`);
      const report: Report = JSON.parse(stdout);

      expect(report.findings.length).toBe(1);
      const finding = report.findings[0]!;
      expect(finding.suggested_fix).toBeDefined();
      expect(finding.suggested_fix!.kind).toBe('replace');
      expect(finding.suggested_fix!.description).toContain('reason');
    });
  });

  describe('guard_contains compound mode', () => {
    it('flags template with async pipe but no loading state', { timeout: 20000 }, () => {
      const { stdout } = run(`review --target "${FIXTURE}" --json --no-cache --rule ux/missing-loading-state`);
      const report: Report = JSON.parse(stdout);

      const asyncListFinding = report.findings.find(f => f.file.includes('async-list.component.html'));
      expect(asyncListFinding).toBeDefined();
      expect(asyncListFinding!.message).toContain('loading');
    });

    it('skips template with async pipe AND loading indicator', { timeout: 20000 }, () => {
      const { stdout } = run(`review --target "${FIXTURE}" --json --no-cache --rule ux/missing-loading-state`);
      const report: Report = JSON.parse(stdout);

      const okFinding = report.findings.find(f => f.file.includes('async-list-ok.component.html'));
      expect(okFinding).toBeUndefined();
    });

    it('skips template without async pipe (guard not satisfied)', { timeout: 20000 }, () => {
      const { stdout } = run(`review --target "${FIXTURE}" --json --no-cache --rule ux/missing-loading-state`);
      const report: Report = JSON.parse(stdout);

      const dashFinding = report.findings.find(f => f.file.includes('dashboard.component.html'));
      expect(dashFinding).toBeUndefined();
    });
  });

  describe('multi_match mode', () => {
    it('reports multiple findings per file when multi_match is true', { timeout: 20000 }, () => {
      const { stdout } = run(`review --target "${FIXTURE}" --json --no-cache --rule component/no-explicit-any`);
      const report: Report = JSON.parse(stdout);

      const multiFindings = report.findings.filter(f => f.file.includes('multi-any.component.ts'));
      expect(multiFindings.length).toBe(3);
      expect(multiFindings.map(f => f.line)).toEqual([8, 9, 10]);
    });
  });

  describe('rule filtering works with YAML rules', () => {
    it('--category filters to YAML-only categories', { timeout: 20000 }, () => {
      const { stdout } = run(`review --target "${FIXTURE}" --json --no-cache --category template`);
      const report: Report = JSON.parse(stdout);

      expect(report.findings.length).toBeGreaterThan(0);
      for (const f of report.findings) {
        expect(f.rule_id).toMatch(/^template\//);
      }
    });

    it('--severity error excludes YAML warning rules', { timeout: 20000 }, () => {
      const { stdout } = run(`review --target "${FIXTURE}" --json --no-cache --severity error`);
      const report: Report = JSON.parse(stdout);

      for (const f of report.findings) {
        expect(f.severity).toBe('error');
      }
    });
  });
});
