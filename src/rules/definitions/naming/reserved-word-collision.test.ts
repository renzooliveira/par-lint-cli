import { describe, it, expect } from 'vitest';
import { reservedWordCollisionRule } from './reserved-word-collision.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('naming/reserved-word-collision', () => {
  it('flags generic domain-reserved variable names', async () => {
    const file = categorizeFile('violations/naming/reserved-words.service.ts');
    const findings = await reservedWordCollisionRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('naming/reserved-word-collision');
  });

  it('passes specific variable names', async () => {
    const file = categorizeFile('valid/naming/specific-names.service.ts');
    const findings = await reservedWordCollisionRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('skips *.config.ts files (framework convention)', async () => {
    const file = categorizeFile('valid/naming/capacitor.config.ts');
    const findings = await reservedWordCollisionRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
