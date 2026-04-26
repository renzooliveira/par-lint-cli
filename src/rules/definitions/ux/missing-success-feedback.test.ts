import { describe, it, expect } from 'vitest';
import { missingSuccessFeedbackRule } from './missing-success-feedback.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('ux/missing-success-feedback', () => {
  it('detects mutation without success feedback', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/missing-success-feedback.component.ts');
    const findings = await missingSuccessFeedbackRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('ux/missing-success-feedback');
  });

  it('does not flag non-component files', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await missingSuccessFeedbackRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
