import { describe, it, expect } from 'vitest';
import { abbreviationInIdentifierRule } from './abbreviation-in-identifier.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('naming/abbreviation-in-identifier', () => {
  it('flags 3+ consecutive uppercase letters', async () => {
    const file = categorizeFile('violations/naming/abbreviations.service.ts');
    const findings = await abbreviationInIdentifierRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(findings[0]!.rule_id).toBe('naming/abbreviation-in-identifier');
  });

  it('passes correct casing', async () => {
    const file = categorizeFile('valid/naming/correct-abbreviations.service.ts');
    const findings = await abbreviationInIdentifierRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
