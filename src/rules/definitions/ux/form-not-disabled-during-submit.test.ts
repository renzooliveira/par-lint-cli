import { describe, it, expect } from 'vitest';
import { formNotDisabledDuringSubmitRule } from './form-not-disabled-during-submit.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('ux/form-not-disabled-during-submit', () => {
  it('flags form with submit but no disable pattern', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/form-no-disable.component.html');
    const findings = await formNotDisabledDuringSubmitRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule_id).toBe('ux/form-not-disabled-during-submit');
    expect(findings[0]!.severity).toBe('warning');
  });

  it('passes when form has disabled binding', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/form-with-disable.component.html');
    const findings = await formNotDisabledDuringSubmitRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
