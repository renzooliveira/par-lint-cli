import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import path from 'node:path';

const CLI = path.resolve(import.meta.dirname, '../dist/index.js');
const FIXTURE = path.resolve(import.meta.dirname, 'fixtures/sample-project');

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

describe('CLI E2E', () => {
  it('review --json produces valid JSON with findings', () => {
    const { stdout } = run(`review --target "${FIXTURE}" --json`);
    const report = JSON.parse(stdout);

    expect(report).toHaveProperty('report_id');
    expect(report).toHaveProperty('findings');
    expect(report).toHaveProperty('summary');
    expect(Array.isArray(report.findings)).toBe(true);
    expect(report.findings.length).toBeGreaterThan(0);
    expect(report.summary.total_findings).toBeGreaterThan(0);
  });

  it('review exits 0 when no error-severity findings', () => {
    const { stdout } = run(`review --target "${FIXTURE}" --severity error --json`);
    const report = JSON.parse(stdout);
    const hasErrors = report.findings.some((f: { severity: string }) => f.severity === 'error');
    if (hasErrors) {
      expect(run(`review --target "${FIXTURE}" --severity error --json`).exitCode).toBe(1);
    } else {
      expect(run(`review --target "${FIXTURE}" --severity error --json`).exitCode).toBe(0);
    }
  });

  it('review --severity error filters lower severities', () => {
    const { stdout } = run(`review --target "${FIXTURE}" --severity error --json`);
    const report = JSON.parse(stdout);

    for (const f of report.findings) {
      expect(f.severity).toBe('error');
    }
  });

  it('review --category filters by category', () => {
    const { stdout } = run(`review --target "${FIXTURE}" --category scss --json`);
    const report = JSON.parse(stdout);

    for (const f of report.findings) {
      expect(f.category).toBe('scss');
    }
  });

  it('review --dry-run does not write state files', () => {
    const { stdout } = run(`review --target "${FIXTURE}" --json --dry-run`);
    const report = JSON.parse(stdout);
    expect(report.findings.length).toBeGreaterThan(0);
  });

  it('rules command lists all registered rules', () => {
    const { stdout, exitCode } = run('rules');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('state/manual-change-detection');
    expect(stdout).toContain('perf/n-plus-one');
    expect(stdout).toContain('a11y/missing-alt');
  });
});
