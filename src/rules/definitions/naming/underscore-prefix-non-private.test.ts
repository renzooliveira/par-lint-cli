import { describe, it, expect } from 'vitest';
import { underscorePrefixNonPrivateRule } from './underscore-prefix-non-private.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('naming/underscore-prefix-non-private', () => {
  it('flags _prefixed members that are not private', async () => {
    const file = categorizeFile('violations/naming/underscore-prefix.service.ts');
    const findings = await underscorePrefixNonPrivateRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(findings[0]!.rule_id).toBe('naming/underscore-prefix-non-private');
  });

  it('passes when underscore only on private members', async () => {
    const file = categorizeFile('valid/naming/correct-underscore.service.ts');
    const findings = await underscorePrefixNonPrivateRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
