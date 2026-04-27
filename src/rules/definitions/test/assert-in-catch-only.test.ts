import { describe, it, expect } from 'vitest';
import { assertInCatchOnlyRule } from './assert-in-catch-only.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('test/assert-in-catch-only', () => {
  it('detects assertions only in catch', async () => {
    const file = categorizeFile('violations/test/assert-in-catch.spec.ts');
    const findings = await assertInCatchOnlyRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
  });

  it('does not flag expect().toThrow()', async () => {
    const file = categorizeFile('valid/test/expect-to-throw.spec.ts');
    const findings = await assertInCatchOnlyRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
