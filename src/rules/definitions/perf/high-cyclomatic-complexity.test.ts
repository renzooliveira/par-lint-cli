import { describe, it, expect } from 'vitest';
import { highCyclomaticComplexityRule } from './high-cyclomatic-complexity.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('perf/high-cyclomatic-complexity', () => {
  it('detects function with high complexity', async () => {
    const config = parLintConfigSchema.parse({
      project: { name: 'test' },
      rules: { 'perf/high-cyclomatic-complexity': { enabled: true, options: { maxComplexity: 5 } } },
    });

    const file = categorizeFile('violations/high-complexity.service.ts');
    const findings = await highCyclomaticComplexityRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('perf/high-cyclomatic-complexity');
    expect(findings[0]!.message).toContain('validate');
  });

  it('does not flag simple functions', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await highCyclomaticComplexityRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
