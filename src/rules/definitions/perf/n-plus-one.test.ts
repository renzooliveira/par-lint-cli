import { describe, it, expect } from 'vitest';
import { nPlusOneRule } from './n-plus-one.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('perf/n-plus-one', () => {
  it('detects HTTP call inside loop', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/n-plus-one.service.ts');
    const findings = await nPlusOneRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('perf/n-plus-one');
    expect(findings[0]!.severity).toBe('error');
  });

  it('does not flag file without loops', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await nPlusOneRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('does not flag Map/Set operations inside loops', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/perf/map-in-loop.service.ts');
    const findings = await nPlusOneRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
