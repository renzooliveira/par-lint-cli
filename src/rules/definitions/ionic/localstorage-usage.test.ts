import { describe, it, expect } from 'vitest';
import { localstorageUsageRule } from './localstorage-usage.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('ionic/localstorage-usage', () => {
  it('detects localStorage usage', async () => {
    const file = categorizeFile('violations/ionic/localstorage-usage.service.ts');
    const findings = await localstorageUsageRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
  });

  it('does not flag Capacitor Preferences', async () => {
    const file = categorizeFile('valid/ionic/capacitor-storage.service.ts');
    const findings = await localstorageUsageRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
