import { describe, it, expect } from 'vitest';
import { missingErrorStateRule } from './missing-error-state.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('ux/missing-error-state', () => {
  it('detects async pipe without error handling', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/missing-error.component.html');
    const findings = await missingErrorStateRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule_id).toBe('ux/missing-error-state');
    expect(findings[0]!.severity).toBe('error');
  });

  it('does not flag template without async pipe', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.html');
    const findings = await missingErrorStateRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
