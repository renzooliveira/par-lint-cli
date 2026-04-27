import { describe, it, expect } from 'vitest';
import { cordovaPluginUsageRule } from './cordova-plugin-usage.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('ionic/cordova-plugin-usage', () => {
  it('detects @ionic-native imports', async () => {
    const file = categorizeFile('violations/ionic/cordova-plugin.service.ts');
    const findings = await cordovaPluginUsageRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
  });

  it('does not flag @capacitor imports', async () => {
    const file = categorizeFile('valid/ionic/capacitor-plugin.service.ts');
    const findings = await cordovaPluginUsageRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
