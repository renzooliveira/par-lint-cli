import { describe, it, expect } from 'vitest';
import { hungarianNotationRule } from './hungarian-notation.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('naming/hungarian-notation', () => {
  it('flags identifiers with type prefixes', async () => {
    const file = categorizeFile('violations/naming/hungarian-notation.service.ts');
    const findings = await hungarianNotationRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(5);
    expect(findings[0]!.rule_id).toBe('naming/hungarian-notation');
  });

  it('passes clean identifiers', async () => {
    const file = categorizeFile('valid/naming/no-hungarian.service.ts');
    const findings = await hungarianNotationRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
