import { describe, it, expect } from 'vitest';
import { missingLabelRule } from './missing-label.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('a11y/missing-label', () => {
  it('detects form controls without labels', async () => {
    const file = categorizeFile('violations/missing-a11y.component.html');
    const findings = await missingLabelRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('a11y/missing-label');
    expect(findings[0]!.message).toContain('missing accessible label');
  });

  it('does not flag properly labeled controls', async () => {
    const file = categorizeFile('valid/clean.component.html');
    const findings = await missingLabelRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
