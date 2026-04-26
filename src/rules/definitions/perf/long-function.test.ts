import { describe, it, expect } from 'vitest';
import { longFunctionRule } from './long-function.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('perf/long-function', () => {
  it('detects function exceeding max lines', async () => {
    const config = parLintConfigSchema.parse({
      project: { name: 'test' },
      rules: { 'perf/long-function': { enabled: true, options: { maxLines: 30 } } },
    });

    const file = categorizeFile('violations/long-function.service.ts');
    const findings = await longFunctionRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('perf/long-function');
    expect(findings[0]!.message).toContain('processData');
  });

  it('does not flag short functions', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await longFunctionRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
