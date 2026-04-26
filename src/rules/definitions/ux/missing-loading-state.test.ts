import { describe, it, expect } from 'vitest';
import { missingLoadingStateRule } from './missing-loading-state.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('ux/missing-loading-state', () => {
  it('detects async pipe without loading indicator', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/missing-loading.component.html');
    const findings = await missingLoadingStateRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule_id).toBe('ux/missing-loading-state');
    expect(findings[0]!.severity).toBe('warning');
  });

  it('does not flag clean template without async', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.html');
    const findings = await missingLoadingStateRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
