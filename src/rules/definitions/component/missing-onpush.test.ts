import { describe, it, expect } from 'vitest';
import { missingOnPushRule } from './missing-onpush.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('component/missing-onpush', () => {
  it('detects component without OnPush', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/missing-onpush.component.ts');
    const findings = await missingOnPushRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule_id).toBe('component/missing-onpush');
    expect(findings[0]!.message).toContain('OnPush');
  });

  it('does not flag component with OnPush', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await missingOnPushRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
