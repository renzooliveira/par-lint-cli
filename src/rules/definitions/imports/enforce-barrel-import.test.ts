import { describe, it, expect } from 'vitest';
import { enforceBarrelImportRule } from './enforce-barrel-import.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('imports/enforce-barrel-import', () => {
  it('flags imports that bypass barrel (deep path alias)', async () => {
    const file = categorizeFile('violations/imports/bypass-barrel.service.ts');
    const findings = await enforceBarrelImportRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(findings[0]!.rule_id).toBe('imports/enforce-barrel-import');
  });

  it('passes barrel imports', async () => {
    const file = categorizeFile('valid/imports/barrel-import.service.ts');
    const findings = await enforceBarrelImportRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
