import { describe, it, expect } from 'vitest';
import { RuleRunner, type RuleDefinition } from './runner.js';
import { parLintConfigSchema } from '../config/schema.js';
import type { CategorizedFile } from '../discovery/categorizer.js';
import { createFinding } from './finding.js';

function makeRule(id: string, tags: string[] = ['is_typescript']): RuleDefinition {
  return {
    id,
    version: '1.0.0',
    category: 'test',
    severity: 'warning',
    applicable_to: tags,
    async run(file) {
      return [createFinding({
        rule_id: id,
        file: file.path,
        line: 1,
        severity: 'warning',
        message: 'test finding',
        source_principle: 'test',
        category: 'test',
      })];
    },
  };
}

describe('RuleRunner.runAll parallel', () => {
  it('processes files concurrently with configured workers', async () => {
    const runner = new RuleRunner();
    const callOrder: string[] = [];

    const slowRule: RuleDefinition = {
      id: 'slow/rule',
      version: '1.0.0',
      category: 'test',
      severity: 'warning',
      applicable_to: [],
      async run(file) {
        callOrder.push(file.path);
        await new Promise((r) => setTimeout(r, 10));
        return [createFinding({
          rule_id: 'slow/rule',
          file: file.path,
          line: 1,
          severity: 'warning',
          message: 'test',
          source_principle: 'test',
          category: 'test',
        })];
      },
    };

    runner.register(slowRule);

    const files: CategorizedFile[] = Array.from({ length: 8 }, (_, i) => ({
      path: `file${i}.ts`,
      tags: ['is_typescript'] as CategorizedFile['tags'],
    }));

    const config = parLintConfigSchema.parse({
      project: { name: 'test' },
      performance: { parallel_workers: 4 },
    });

    const report = await runner.runAll(files, config, '/tmp');
    expect(report.findings).toHaveLength(8);
    expect(report.performance.files_analyzed).toBe(8);
  });
});

describe('RuleRunner', () => {
  it('skips rule when file matches exclude glob', async () => {
    const runner = new RuleRunner();
    runner.register(makeRule('scss/hardcoded-color', ['is_scss']));

    const config = parLintConfigSchema.parse({
      project: { name: 'test' },
      rules: {
        'scss/hardcoded-color': {
          enabled: true,
          exclude: ['**/variables.*', '**/theme/**'],
        },
      },
    });

    const excluded: CategorizedFile = { path: 'src/theme/variables.scss', tags: ['is_scss', 'is_style'] };
    const findings = await runner.runFile(excluded, config, '/tmp');
    expect(findings).toHaveLength(0);

    const normal: CategorizedFile = { path: 'src/app/home/home.component.scss', tags: ['is_scss', 'is_style'] };
    const normalFindings = await runner.runFile(normal, config, '/tmp');
    expect(normalFindings).toHaveLength(1);
  });

  it('skips rule when file path matches theme directory exclude', async () => {
    const runner = new RuleRunner();
    runner.register(makeRule('scss/hardcoded-color', ['is_scss']));

    const config = parLintConfigSchema.parse({
      project: { name: 'test' },
      rules: {
        'scss/hardcoded-color': {
          enabled: true,
          exclude: ['**/theme/**'],
        },
      },
    });

    const excluded: CategorizedFile = { path: 'src/theme/colors.scss', tags: ['is_scss', 'is_style'] };
    const findings = await runner.runFile(excluded, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('runs rule normally when no exclude configured', async () => {
    const runner = new RuleRunner();
    runner.register(makeRule('test/rule'));

    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file: CategorizedFile = { path: 'src/app/test.ts', tags: ['is_typescript'] };
    const findings = await runner.runFile(file, config, '/tmp');
    expect(findings).toHaveLength(1);
  });
});
