import { describe, it, expect } from 'vitest';
import { lawOfDemeterRule } from './law-of-demeter.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('domain/law-of-demeter', () => {
  it('detects deep property chains (3+ dots)', async () => {
    const file = categorizeFile('violations/domain/law-of-demeter.service.ts');
    const findings = await lawOfDemeterRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('domain/law-of-demeter');
    expect(findings[0]!.message).toContain('Law of Demeter');
  });

  it('does not flag shallow chains', async () => {
    const file = categorizeFile('valid/domain/no-deep-chain.service.ts');
    const findings = await lawOfDemeterRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
