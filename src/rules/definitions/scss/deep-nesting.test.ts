import { describe, it, expect } from 'vitest';
import { deepNestingRule } from './deep-nesting.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('scss/deep-nesting', () => {
  it('detects nesting deeper than 3 levels', async () => {
    const file = categorizeFile('violations/deep-nesting.component.scss');
    const findings = await deepNestingRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('scss/deep-nesting');
    expect(findings[0]!.category).toBe('scss');
    expect(findings[0]!.message).toContain('nesting depth');
  });

  it('does not flag clean scss', async () => {
    const file = categorizeFile('valid/clean.component.scss');
    const findings = await deepNestingRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
