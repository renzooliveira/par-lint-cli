import { describe, it, expect } from 'vitest';
import { typeAssertionWithoutGuardRule } from './type-assertion-without-guard.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('typescript/type-assertion-without-guard', () => {
  it('detects as Type without guard', async () => {
    const file = categorizeFile('violations/typescript/type-assertion.service.ts');
    const findings = await typeAssertionWithoutGuardRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('typescript/type-assertion-without-guard');
  });

  it('does not flag file with type guard', async () => {
    const file = categorizeFile('valid/typescript/type-guard.service.ts');
    const findings = await typeAssertionWithoutGuardRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
