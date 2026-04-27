import { describe, it, expect } from 'vitest';
import { booleanMissingPrefixRule } from './boolean-missing-prefix.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('naming/boolean-missing-prefix', () => {
  it('detects booleans without prefix', async () => {
    const file = categorizeFile('violations/naming/boolean-missing-prefix.service.ts');
    const findings = await booleanMissingPrefixRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(findings[0]!.message).toContain('prefix');
  });

  it('does not flag booleans with is/has/can prefix', async () => {
    const file = categorizeFile('valid/naming/boolean-with-prefix.service.ts');
    const findings = await booleanMissingPrefixRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
