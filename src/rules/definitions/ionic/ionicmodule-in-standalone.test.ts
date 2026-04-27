import { describe, it, expect } from 'vitest';
import { ionicmoduleInStandaloneRule } from './ionicmodule-in-standalone.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('ionic/ionicmodule-in-standalone', () => {
  it('detects IonicModule in standalone component', async () => {
    const file = categorizeFile('violations/ionic/ionicmodule-standalone.component.ts');
    const findings = await ionicmoduleInStandaloneRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(1);
    expect(findings[0]!.severity).toBe('error');
    expect(findings[0]!.message).toContain('individual Ionic components');
  });

  it('does not flag individual imports', async () => {
    const file = categorizeFile('valid/ionic/standalone-individual-imports.component.ts');
    const findings = await ionicmoduleInStandaloneRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
