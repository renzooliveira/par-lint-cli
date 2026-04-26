import { describe, it, expect } from 'vitest';
import { hardcodedPlatformCheckRule } from './hardcoded-platform-check.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('ionic/hardcoded-platform-check', () => {
  it('detects hardcoded platform.is() calls', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/hardcoded-platform.component.ts');
    const findings = await hardcodedPlatformCheckRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('ionic/hardcoded-platform-check');
    expect(findings[0]!.message).toContain('platform.is');
  });

  it('does not flag file without platform checks', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await hardcodedPlatformCheckRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
