import { describe, it, expect } from 'vitest';
import { nonDescriptiveIdentifierRule } from './non-descriptive-identifier.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('naming/non-descriptive-identifier', () => {
  it('flags short and generic identifiers', async () => {
    const file = categorizeFile('violations/naming/non-descriptive.service.ts');
    const findings = await nonDescriptiveIdentifierRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(4);
    expect(findings[0]!.rule_id).toBe('naming/non-descriptive-identifier');
  });

  it('passes descriptive names', async () => {
    const file = categorizeFile('valid/naming/descriptive-names.service.ts');
    const findings = await nonDescriptiveIdentifierRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
