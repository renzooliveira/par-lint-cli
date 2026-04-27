import { describe, it, expect } from 'vitest';
import { alwaysTrueAssertionRule } from './always-true-assertion.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('test/always-true-assertion', () => {
  it('detects expect(true).toBe(true) and similar', async () => {
    const file = categorizeFile('violations/test/always-true.spec.ts');
    const findings = await alwaysTrueAssertionRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.message).toContain('Tautological');
  });

  it('does not flag meaningful assertions', async () => {
    const file = categorizeFile('valid/test/meaningful-assertions.spec.ts');
    const findings = await alwaysTrueAssertionRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
