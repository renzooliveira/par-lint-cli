import { describe, it, expect } from 'vitest';
import { noFocusedTestRule } from './no-focused-test.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('test/no-focused-test', () => {
  it('flags fdescribe/fit/only/skip', async () => {
    const file = categorizeFile('violations/test/focused-test.spec.ts');
    const findings = await noFocusedTestRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('test/no-focused-test');
  });

  it('passes normal tests', async () => {
    const file = categorizeFile('valid/test/normal-test.spec.ts');
    const findings = await noFocusedTestRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
