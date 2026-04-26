import { describe, it, expect } from 'vitest';
import { missingMotionReduceRule } from './missing-motion-reduce.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('ux/missing-motion-reduce', () => {
  it('detects animation without prefers-reduced-motion', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/missing-reduced-motion.component.scss');
    const findings = await missingMotionReduceRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('ux/missing-motion-reduce');
  });

  it('does not flag clean SCSS', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.scss');
    const findings = await missingMotionReduceRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
