import { describe, it, expect } from 'vitest';
import { inconsistentObservableSuffixRule } from './inconsistent-observable-suffix.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('naming/inconsistent-observable-suffix', () => {
  it('flags Observable without $ suffix when project uses convention', async () => {
    const file = categorizeFile('violations/naming/observable-suffix.service.ts');
    const findings = await inconsistentObservableSuffixRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('naming/inconsistent-observable-suffix');
  });

  it('passes consistent $ suffix usage', async () => {
    const file = categorizeFile('valid/naming/correct-observable.service.ts');
    const findings = await inconsistentObservableSuffixRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
