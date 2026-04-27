import { describe, it, expect } from 'vitest';
import { noAssertionRule } from './no-assertion.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('test/no-assertion', () => {
  it('flags it/test blocks without expect', async () => {
    const file = categorizeFile('violations/test/no-assertion.spec.ts');
    const findings = await noAssertionRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('test/no-assertion');
  });

  it('passes tests with assertions', async () => {
    const file = categorizeFile('valid/test/real-spec.spec.ts');
    const findings = await noAssertionRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
