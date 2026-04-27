import { describe, it, expect } from 'vitest';
import { unusedImportRule } from './unused-import.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('hygiene/unused-import', () => {
  it('flags imports not referenced in file', async () => {
    const file = categorizeFile('violations/hygiene/unused-import.service.ts');
    const findings = await unusedImportRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('hygiene/unused-import');
  });

  it('passes when all imports are used', async () => {
    const file = categorizeFile('valid/hygiene/all-imports-used.service.ts');
    const findings = await unusedImportRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
