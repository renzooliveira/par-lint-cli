import { describe, it, expect } from 'vitest';
import { indexBarrelOnlyRule } from './index-barrel-only.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('naming/index-barrel-only', () => {
  it('flags index with logic/classes/functions', async () => {
    const file = categorizeFile('violations/naming/bad-barrel.ts');
    const findings = await indexBarrelOnlyRule.run(
      { ...file, path: 'violations/naming/index.ts' },
      config,
      FIXTURES,
    );

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('naming/index-barrel-only');
    expect(findings[0]!.message).toContain('re-export');
  });

  it('passes clean barrel with only re-exports', async () => {
    const file = categorizeFile('valid/naming/clean-barrel.ts');
    const findings = await indexBarrelOnlyRule.run(
      { ...file, path: 'valid/naming/index.ts' },
      config,
      FIXTURES,
    );

    expect(findings).toHaveLength(0);
  });

  it('skips non-index files', async () => {
    const file = categorizeFile('valid/naming/user.service.ts');
    const findings = await indexBarrelOnlyRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
