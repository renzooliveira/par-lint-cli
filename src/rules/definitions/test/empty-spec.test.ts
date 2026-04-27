import { describe, it, expect } from 'vitest';
import { emptySpecRule } from './empty-spec.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('test/empty-spec', () => {
  it('flags spec without it/test/expect', async () => {
    const file = categorizeFile('violations/test/empty-spec.spec.ts');
    const findings = await emptySpecRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('test/empty-spec');
  });

  it('passes spec with real tests', async () => {
    const file = categorizeFile('valid/test/real-spec.spec.ts');
    const findings = await emptySpecRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
