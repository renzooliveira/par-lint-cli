import { describe, it, expect } from 'vitest';
import { RuleRunner } from './engine/runner.js';
import { ALL_RULES } from './rules/registry.js';
import { categorizeFiles } from './discovery/categorizer.js';
import { parLintConfigSchema } from './config/schema.js';
import { reconcileFindings } from './engine/state.js';
import { formatJson } from './cli/formatters/json.js';
import { formatSarif } from './cli/formatters/sarif.js';
import { formatMarkdown } from './cli/formatters/markdown.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'integration-test' } });

describe('integration: full pipeline', () => {
  it('registers all 29 rules', () => {
    const runner = new RuleRunner();
    runner.registerMany(ALL_RULES);
    expect(runner.registeredRules).toHaveLength(29);
  });

  it('runs all rules against violation fixtures and produces findings', async () => {
    const runner = new RuleRunner();
    runner.registerMany(ALL_RULES);

    const files = categorizeFiles([
      'violations/manual-change-detection.component.ts',
      'violations/subscribe-without-cleanup.component.ts',
      'violations/deep-nesting.component.scss',
      'violations/hardcoded-colors.component.scss',
      'violations/hardcoded-spacing.component.scss',
      'violations/missing-a11y.component.html',
    ]);

    const report = await runner.runAll(files, config, FIXTURES);

    expect(report.findings.length).toBeGreaterThan(0);
    expect(report.summary.total_findings).toBeGreaterThan(0);
    expect(report.performance.files_analyzed).toBe(6);

    const categories = new Set(report.findings.map((f) => f.category));
    expect(categories.has('state')).toBe(true);
    expect(categories.has('scss')).toBe(true);
    expect(categories.has('a11y')).toBe(true);
  });

  it('reconciles with null state (all new)', async () => {
    const runner = new RuleRunner();
    runner.registerMany(ALL_RULES);

    const files = categorizeFiles(['violations/manual-change-detection.component.ts']);
    const report = await runner.runAll(files, config, FIXTURES);

    const { findings, resolved } = reconcileFindings(report.findings, null);

    expect(findings.every((f) => f.status === 'new')).toBe(true);
    expect(resolved).toHaveLength(0);
  });

  it('produces valid JSON output', async () => {
    const runner = new RuleRunner();
    runner.registerMany(ALL_RULES);

    const files = categorizeFiles(['violations/hardcoded-colors.component.scss']);
    const report = await runner.runAll(files, config, FIXTURES);

    const json = formatJson(report);
    const parsed = JSON.parse(json);

    expect(parsed.report_id).toBeDefined();
    expect(parsed.findings.length).toBeGreaterThan(0);
  });

  it('produces valid SARIF output', async () => {
    const runner = new RuleRunner();
    runner.registerMany(ALL_RULES);

    const files = categorizeFiles(['violations/missing-a11y.component.html']);
    const report = await runner.runAll(files, config, FIXTURES);

    const sarif = formatSarif(report);
    const parsed = JSON.parse(sarif);

    expect(parsed.version).toBe('2.1.0');
    expect(parsed.runs[0].results.length).toBeGreaterThan(0);
  });

  it('produces valid Markdown output', async () => {
    const runner = new RuleRunner();
    runner.registerMany(ALL_RULES);

    const files = categorizeFiles(['violations/missing-a11y.component.html']);
    const report = await runner.runAll(files, config, FIXTURES);

    const md = formatMarkdown(report);

    expect(md).toContain('# par-lint Report');
    expect(md).toContain('a11y');
  });

  it('runs clean fixtures with zero findings', async () => {
    const runner = new RuleRunner();
    runner.registerMany(ALL_RULES);

    const files = categorizeFiles([
      'valid/clean.component.ts',
      'valid/clean.component.html',
      'valid/clean.component.scss',
    ]);

    const report = await runner.runAll(files, config, FIXTURES);

    expect(report.findings).toHaveLength(0);
  });
});
