import { describe, it, expect } from 'vitest';
import { emptyCatchRule } from './empty-catch.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('error/empty-catch', () => {
  it('flags empty catch blocks', async () => {
    const file = categorizeFile('violations/error/empty-catch.service.ts');
    const findings = await emptyCatchRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('error/empty-catch');
  });

  it('passes catch blocks with handling', async () => {
    const file = categorizeFile('valid/error/handled-catch.service.ts');
    const findings = await emptyCatchRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
