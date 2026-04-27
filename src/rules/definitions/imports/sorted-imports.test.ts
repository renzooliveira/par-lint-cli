import { describe, it, expect } from 'vitest';
import { sortedImportsRule } from './sorted-imports.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('imports/sorted-imports', () => {
  it('flags unsorted imports', async () => {
    const file = categorizeFile('violations/imports/unsorted-imports.service.ts');
    const findings = await sortedImportsRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('imports/sorted-imports');
  });

  it('passes correctly sorted imports', async () => {
    const file = categorizeFile('valid/imports/sorted-imports.service.ts');
    const findings = await sortedImportsRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
