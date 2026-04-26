import { describe, it, expect } from 'vitest';
import { heavyComputationInRenderRule } from './heavy-computation-in-render.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('perf/heavy-computation-in-render', () => {
  it('detects function calls in template interpolation', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/heavy-computation.component.html');
    const findings = await heavyComputationInRenderRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('perf/heavy-computation-in-render');
  });

  it('does not flag clean template', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.html');
    const findings = await heavyComputationInRenderRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
