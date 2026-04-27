import { describe, it, expect } from 'vitest';
import { commentedOutAssertionRule } from './commented-out-assertion.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('test/commented-out-assertion', () => {
  it('detects commented expect()', async () => {
    const file = categorizeFile('violations/test/commented-assertion.spec.ts');
    const findings = await commentedOutAssertionRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
  });

  it('does not flag active assertions', async () => {
    const file = categorizeFile('valid/test/meaningful-assertions.spec.ts');
    const findings = await commentedOutAssertionRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
