import { describe, it, expect } from 'vitest';
import { hardcodedSpacingRule } from './hardcoded-spacing.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('scss/hardcoded-spacing', () => {
  it('detects hardcoded px values in spacing props', async () => {
    const file = categorizeFile('violations/hardcoded-spacing.component.scss');
    const findings = await hardcodedSpacingRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(findings.some((f) => f.message.includes('margin'))).toBe(true);
    expect(findings.some((f) => f.message.includes('padding'))).toBe(true);
    expect(findings[0]!.rule_id).toBe('scss/hardcoded-spacing');
  });

  it('does not flag variable-based spacing', async () => {
    const file = categorizeFile('valid/clean.component.scss');
    const findings = await hardcodedSpacingRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
