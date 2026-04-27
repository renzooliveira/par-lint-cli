import { describe, it, expect } from 'vitest';
import { enumInsteadOfConstRule } from './enum-instead-of-const.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('fp/enum-instead-of-const', () => {
  it('detects enum declarations', async () => {
    const file = categorizeFile('violations/fp/enum-usage.service.ts');
    const findings = await enumInsteadOfConstRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
    expect(findings[0]!.message).toContain('as const');
  });

  it('does not flag as const objects', async () => {
    const file = categorizeFile('valid/fp/const-enum.service.ts');
    const findings = await enumInsteadOfConstRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
